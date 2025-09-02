import asyncio
import logging
import json
from fastapi import Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuthError
from app.auth.services.oidc_config import oauth
from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.helpers import generate_error_response, string_error_response
from starsessions.session import get_session_handler
import jwt
from fastapi import Response
from app.utils.schemas import ResponseModel
import httpx # Added import
from datetime import datetime
from app.auth.services.auth_user_session import get_user_info, update_session_tokens, get_session_by_session_id, remove_session_by_session_id
from app.utils.request_error_handler import RequestErrorHandler
from urllib.parse import urlencode
from redis.asyncio import Redis
from redis.exceptions import ConnectionError, TimeoutError, RedisError
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator

logger = logging.getLogger(__name__)


async def redis_retry_operation(operation, max_retries=3, delay=1.0):
    """
    Retry Redis operations with exponential backoff.
    
    Args:
        operation: Async function to execute
        max_retries: Maximum number of retry attempts (default: 3)
        delay: Initial delay between retries in seconds (default: 1.0)
    
    Returns:
        Result of the operation if successful
        
    Raises:
        RedisError: If all retry attempts fail
    """
    for attempt in range(max_retries + 1):
        try:
            return await operation()
        except (ConnectionError, TimeoutError, RedisError) as e:
            if attempt == max_retries:
                logger.error(f"Redis operation failed after {max_retries} retries: {str(e)}")
                raise e
            
            retry_delay = delay * (2 ** attempt)  # Exponential backoff
            logger.warning(f"Redis operation failed (attempt {attempt + 1}/{max_retries + 1}): {str(e)}. Retrying in {retry_delay:.1f}s...")
            await asyncio.sleep(retry_delay)


async def get_redis_client(request: Request) -> Redis:
    """Get Redis client from the app state."""
    if hasattr(request.app.state, 'redis_client'):
        return request.app.state.redis_client
    else:
        # Fallback to creating a new Redis connection if not available
        config = get_configuration()
        redis_url = config.session_config.SESSION_REDIS_URL or "redis://localhost:6379/0"
        return Redis.from_url(redis_url)



def get_base_profile_management_url():
    config = get_configuration()
    redirectValue = config.PROFILE_MANAGEMENT_DOMAIN

    if config.ENVIRONMENT != "local":
        redirectValue = f"https://{config.PROFILE_MANAGEMENT_DOMAIN}"
    return redirectValue


def get_callback_redirect_uri(request: Request):
    """
    Get the redirect URI for the OAuth login flow.
    """
    config = get_configuration()
    redirect_uri = request.url_for(SessionKeys.CALLBACK_ROUTE_NAME.value)

    if config.ENVIRONMENT != "local":
        redirect_uri = str(redirect_uri).replace("http://", "https://")

    logger.info(f"Callback Redirect URI: {redirect_uri}")
    return redirect_uri


async def redirect_user_to_idp_verify(request: Request):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    try:
        callback_redirect_uri = get_callback_redirect_uri(request)
        if oauth.verify is None:
            logger.error("OAuth verify client is not configured properly")
            raise HTTPException(status_code=500, detail="OAuth configuration error")
        return await oauth.verify.authorize_redirect(request, callback_redirect_uri)
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify", str(e))
        RequestErrorHandler.handle(
            e, context="Unexpected error during idp redirect"
        )


async def callback_handler(request: Request):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate the login process with IBM Verify.
    """
    try:
        redirectValue = get_base_profile_management_url()
        returnToPageValue = request.session.get(SessionKeys.RETURN_TO_PAGE.value)

        if returnToPageValue:
            clientRedirectValue = f"{returnToPageValue}?{SessionKeys.RETURN_TO_PAGE.value}={returnToPageValue}"
            redirectValue += clientRedirectValue
            logger.info(f"Return to page set in session: {redirectValue}")

        try:
            if oauth.verify is None:
                logger.error("OAuth verify client is not configured properly")
                raise HTTPException(status_code=500, detail="OAuth configuration error")
            oidc_response = await oauth.verify.authorize_access_token(request)
            logger.info("OIDC Responsed")
        except OAuthError as error:
            logger.error(f"OAuth error during token retrieval: {error}")
            logger.error(
                f"Redirect user back to IBM Verify to be re-authenticated: {redirectValue}"
            )
            # redirect back to IBM Verify to retry authentication
            raise OAuthError("Invalid or expired token") from error
        await update_session_tokens(request, oidc_response)

        # Get the handler and set your sid as session id. sid is unique session id from GC Sign-In 
        handler = get_session_handler(request)  
        new_session_id = oidc_response.get('userinfo').get('sid')
        handler.session_id = new_session_id

        # Create a Redis pubsub channel for the session
        redis_channel = f"notification:{handler.session_id}"
        logger.info(f"Subscribed to Redis pubsub channel: {redis_channel}")
        
        # create task run every 5 seconds to check session status
        async def check_session_status():

            config = get_configuration()
            try:           
                redis_client = await get_redis_client(request)
                while True:
                    await asyncio.sleep(5)
                    # Check session status and send updates to the channel
                    # If session is invalid, publish a message to the channel
                    session_data = await get_session_by_session_id(new_session_id, request)
                    if not session_data or not session_data.get(SessionKeys.SESSION_USER_INFO.value):
                        message_data = {"status": "terminated"}
                        await redis_retry_operation(
                            lambda: redis_client.publish(redis_channel, json.dumps(message_data))
                        )
                        return
                    else:
                        session_metadata = session_data.get(SessionKeys.SESSION_METADATA.value)
                        session_expire = config.session_config.SESSION_LIFETIME 
                        if session_metadata:
                            last_access = session_metadata.get(SessionKeys.SESSION_METADATA_LAST_ACCESS.value)
                        if last_access:
                            session_expire = last_access + session_expire
                        # Prepare message data with optional last_access info
                        message_data = {"status": "active", "expire": session_expire}
                        await redis_retry_operation(
                            lambda: redis_client.publish(redis_channel, json.dumps(message_data))
                        )
                        logger.debug(f"Send active message {message_data} to channel: {redis_channel}.")
            except asyncio.CancelledError:
                logger.info(f"redis channel not reachable: {redis_channel}")
                return
            except Exception as e:
                logger.error(f"Error in session status publish: {e}")
                return
            finally:
                 if redis_client and not hasattr(request.app.state, 'redis_client'):
                    # Only close if we created our own connection
                    try:
                        await redis_client.close()
                        logger.info(f"Cleaned up Redis connection for channel: {redis_channel}")
                    except Exception as e:
                        logger.error(f"Error cleaning up Redis connection: {str(e)}")

        # Start the background task to monitor session status
        asyncio.create_task(check_session_status())


        logger.info("OIDC Callback Handler")
        logger.info(f"Redirect to PROFILE_MANAGEMENT_DOMAIN: {redirectValue}")
        return RedirectResponse(url=redirectValue)
    except OAuthError as error:
        logger.error(f"OAuth error: {error}")
        raise OAuthError("Invalid or expired token") from error
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        RequestErrorHandler.handle(
            e, context="Unexpected error during idp redirect"
        )


async def reauthenticate_user(request: Request, returnToPage: str = "/"):
    """
    Get the redirect URL for the OAuth login flow.
    This function is used to initiate a reauthentication flow with IBM Verify.
    """
    try:

        callback_redirect_uri = get_callback_redirect_uri(request)

        if returnToPage:
            request.session[SessionKeys.RETURN_TO_PAGE.value] = returnToPage
            logger.info(f"Return to page set in session: {returnToPage}")

        if oauth.verify is None:
            logger.error("OAuth verify client is not configured properly")
            raise HTTPException(status_code=500, detail="OAuth configuration error")
        return await oauth.verify.authorize_redirect(
            request, callback_redirect_uri, acr_values="update_password"
        )
    except OAuthError as error:
        logger.exception("Unexpected error during redirect_to_verify")
        raise OAuthError("Invalid or expired token") from error
    except Exception as e:
        logger.exception("Unexpected error during redirect_to_verify")
        RequestErrorHandler.handle(e, context="Unexpected error")



async def backchannel_logout(request: Request):
    """
    Logs out the user by clearing the session and redirecting to the logout endpoint.
    """
    try:
        config = request.app.state.config

        # from request get logout_token and sub
        logout_form = await request.form()
        logout_token = logout_form.get("logout_token")

        # Validate the logout_token, if not string or empty return 400
        if not logout_token or not isinstance(logout_token, str):
            logger.error("No logout_token provided in backchannel_logout request.")
            raise HTTPException(status_code=400, detail="No logout_token provided")

        # Fetch JWKS from the well-known URL
        jwks_uri = config.oidc_well_known_config.get("jwks_uri")
        if not jwks_uri:
            logger.error("jwks_uri not found in OIDC well-known configuration.")
            raise HTTPException(status_code=500, detail="JWKS URI not configured.")

        async with httpx.AsyncClient() as client:
            jwks_response = await client.get(jwks_uri)
            jwks_response.raise_for_status()
            jwks = jwks_response.json()

        # Decode the logout_token with signature verification using JWKS
        # The 'algorithms' should match what your IdP uses for signing.
        # The 'audience' and 'issuer' should also be verified.
        decoded_token = jwt.decode(
            logout_token,
            key=jwks,
            algorithms=["RS256"], # Common algorithm for OIDC. Adjust if needed.
            audience=config.IBM_VERIFY_API_CLIENT_ID, # Your client ID
            issuer=config.oidc_well_known_config.get("issuer"), # IdP's issuer URL
            options={"verify_signature": True}
        )
        sid = decoded_token.get("sid")

        if not sid:
            logger.error("No 'sid' claim found in logout_token.")
            raise HTTPException(status_code=400, detail="No 'sid' claim found in logout_token")
        
        # Get the handler and set your custom UUID  
        handler = get_session_handler(request)  
        # Remove the session associated with the 'sub'
        await handler.store.remove(sid)

        logger.info(f"User session for sub '{sid}' cleared.")

        # According to OIDC Back-Channel Logout spec, a 200 OK response is sufficient.
        # No redirect is needed for back-channel logout.
        return Response(status_code=200)
    except Exception as e:
        logger.exception("Unexpected error during backchannel_logout", str(e))
        return generate_error_response(400, string_error_response())
    
async def logout_user(request: Request):
    """
    Logs out the user by clearing the session and redirecting to the logout endpoint.
    """
    try:
        config = request.app.state.config
        id_token = await get_id_token(request)
        user_info = await get_user_info(request)

        if not id_token:
            logger.error("No id_token found in session during logout.")
            raise HTTPException(status_code=400, detail="No id_token found in session")
        # Clear the session
        # request.session.clear()
        # Remove the session associated with the 'sid'
        await remove_session_by_session_id(user_info.get("sid"), request)

        # Construct the logout redirect URL
        end_session_endpoint = config.end_session_endpoint
        post_logout_redirect_uri = get_base_profile_management_url()
        
        # Build the logout URL with query parameters
        
        params = {
            "id_token_hint": id_token,
            "post_logout_redirect_uri": post_logout_redirect_uri
        }
        redirect_url = f"{end_session_endpoint}?{urlencode(params)}"
        
        logger.debug(f"Constructed logout redirect URL: {redirect_url}")

        # Return the redirect URL for the client to use
        return ResponseModel(
            success=True,
            data=redirect_url,
            message="Logout URL constructed successfully",
        )
    except Exception as e:
        logger.exception("Unexpected error during logout", str(e))
        RequestErrorHandler.handle(e, context="Unexpected error during logout")


async def refresh_id_token(refresh_token: str):
    """
    Refreshes the id_token using the refresh_token.
    """
    try:
        if oauth.verify is None:
            logger.error("OAuth verify client is not configured properly")
            return None
        new_tokens = await oauth.verify.fetch_access_token(refresh_token=refresh_token, grant_type="refresh_token")
        return new_tokens
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        return None


async def get_id_token(request: Request):
    """
    Get the id_token from the session, refreshing it if necessary.
    """
    id_token = request.session.get(SessionKeys.SESSION_USER_ID_TOKEN_KEY.value)

    if not id_token:
        return

    try:
        decoded_token = jwt.decode(id_token, options={"verify_signature": False})
        exp = decoded_token.get("exp")
        if exp and exp < datetime.now().timestamp() + 60:  # If token expires in 1 minute
            refresh_token = request.session.get(SessionKeys.SESSION_USER_REFRESH_TOKEN_KEY.value)
            if not refresh_token:
                return None

            new_tokens = await refresh_id_token(refresh_token)
            if not new_tokens:
                return None
            
            if oauth.verify is None:
                logger.error("OAuth verify client is not configured properly")
                return None
            userinfo = await oauth.verify.parse_id_token(new_tokens, None)
            new_tokens["userinfo"] = userinfo

            await update_session_tokens(request, new_tokens)
            return new_tokens.get("id_token")
    except jwt.PyJWTError as e:
        logger.error(f"Error decoding token: {e}")
        return None

    return id_token
    
async def session_event_generator(request: Request):
    """
    Server-Sent Events (SSE) generator for streaming events to the client.
    """
    async def event_stream() -> AsyncGenerator[str, None]:
        """Generate Server-Sent Events stream"""
        redis_client = None
        pubsub = None
        user_info = request.session.get(SessionKeys.SESSION_USER_INFO.value)
        if not user_info or not user_info.get("sid"):
            return

        session_id = user_info.get("sid")

        try:  
            channel_name = f"notification:{session_id}"
            logger.info(f"Starting SSE stream for session: {session_id}, channel: {channel_name}")
            
            # Get Redis client and create pubsub
            redis_client = await get_redis_client(request)
            pubsub = redis_client.pubsub()
            await pubsub.subscribe(channel_name)
            
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connected', 'session_id': session_id, 'timestamp': asyncio.get_event_loop().time()})}\n\n"
            
            # Listen for messages with timeout
            while True:
                try:
                    # Check if client is still connected by checking if request is disconnected
                    if await request.is_disconnected():
                        logger.info(f"Client disconnected for session: {session_id}")
                        break
                    
                    # Wait for message with timeout
                    message = await asyncio.wait_for(pubsub.get_message(ignore_subscribe_messages=True), timeout=2.0)
                    
                    if message and message['type'] == 'message':
                        # Decode and forward the message
                        try:
                            message_data = message['data']
                            if isinstance(message_data, bytes):
                                message_data = message_data.decode('utf-8')
                            
                            # Validate JSON and add timestamp
                            try:
                                parsed_data = json.loads(message_data)
                                parsed_data['timestamp'] = asyncio.get_event_loop().time()
                                message_data = json.dumps(parsed_data)
                            except json.JSONDecodeError:
                                # If not valid JSON, wrap in a standard format
                                message_data = json.dumps({
                                    'type': 'notification',
                                    'message': message_data,
                                    'timestamp': asyncio.get_event_loop().time()
                                })
                            
                            yield f"data: {message_data}\n\n"
                            logger.info(f"Sent SSE message to session {session_id}: {message_data}")
                            
                        except Exception as e:
                            logger.error(f"Error processing message for session {session_id}: {str(e)}")
                            error_data = json.dumps({
                                'type': 'error',
                                'message': 'Error processing notification',
                                'timestamp': asyncio.get_event_loop().time()
                            })
                            yield f"data: {error_data}\n\n"
                    
                    # Small delay to prevent busy waiting
                    await asyncio.sleep(0.1)
                    
                except asyncio.TimeoutError:
                    # Send heartbeat on timeout
                    heartbeat_data = json.dumps({
                        'type': 'heartbeat',
                        'timestamp': asyncio.get_event_loop().time()
                    })
                    yield f"data: {heartbeat_data}\n\n"
                    
                except Exception as e:
                    logger.error(f"Error in SSE stream for session {session_id}: {str(e)}")
                    error_data = json.dumps({
                        'type': 'error',
                        'message': str(e),
                        'timestamp': asyncio.get_event_loop().time()
                    })
                    yield f"data: {error_data}\n\n"
                    break
                    
        except Exception as e:
            logger.error(f"Fatal error in SSE stream: {str(e)}")
            error_data = json.dumps({
                'type': 'fatal_error',
                'message': str(e),
                'timestamp': asyncio.get_event_loop().time()
            })
            yield f"data: {error_data}\n\n"
            
        finally:
            # Cleanup resources
            if pubsub:
                try:
                    await pubsub.unsubscribe()
                    await pubsub.close()
                    logger.info(f"Cleaned up pubsub for session: {session_id}")
                except Exception as e:
                    logger.error(f"Error cleaning up pubsub: {str(e)}")
            
            if redis_client and not hasattr(request.app.state, 'redis_client'):
                # Only close if we created our own connection
                try:
                    await redis_client.close()
                    logger.info(f"Cleaned up Redis connection for session: {session_id}")
                except Exception as e:
                    logger.error(f"Error cleaning up Redis connection: {str(e)}")

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )