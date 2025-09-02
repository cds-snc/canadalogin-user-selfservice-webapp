import { useState, useEffect, useRef, useCallback } from 'react';
import config from '../config.jsx';
import { SUBMIT_END_POINTS } from "../utils/constants";

const useSessionTimeout = ({
    onTimeout,
    onWarning,
    onStayLoggedIn,
    onLogout,
    enabled = true
}) => {
    const [isWarning, setIsWarning] = useState(false);
    const [expirationTime, setExpirationTime] = useState(null);
    const [sessionStatus, setSessionStatus] = useState('live');
    const timeoutRef = useRef(null);
    const warningTimeoutRef = useRef(null);
    const eventSourceRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    const resetTimer = useCallback((expireTime) => {

        // Clear existing timers
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
        }

        // Reset warning state
        setIsWarning(false);
        lastActivityRef.current = Date.now();

        if (!enabled || !expireTime) return;

        const expirationDate = new Date(Number(expireTime) * 1000);
        setExpirationTime(expirationDate);
        console.log('Session expiration time:', expirationDate.toLocaleString());

        const now = new Date();
        const timeUntilExpiration = expirationDate.getTime() - now.getTime();
        
        console.log('Time until expiration (minutes):', Math.round(timeUntilExpiration / 60000));
        
        // Only proceed if there's actually time left
        if (timeUntilExpiration <= 0) {
            // Session has already expired
            console.log('Session has already expired');
            if (onTimeout) {
                onTimeout();
            }
            return;
        }
        
        const warningTime = Math.max(0, timeUntilExpiration - (config.sessionExpireWarning * 1000)); // Show warning 5 minutes before expiration

        if (timeUntilExpiration > (config.sessionExpireWarning * 1000) && warningTime > 0) {
            warningTimeoutRef.current = setTimeout(() => {
                    setIsWarning(true);
                    if (onWarning) {
                        onWarning();
                     }
            }, warningTime);
        } else if (timeUntilExpiration <= (config.sessionExpireWarning * 1000) && timeUntilExpiration > 0) {
            setIsWarning(true);
            if (onWarning) {
                onWarning();
            }
        }

        // Set timeout timer
        if (timeUntilExpiration > 0) {
            timeoutRef.current = setTimeout(() => {
                if (onTimeout) {
                    onTimeout();
                }
            }, timeUntilExpiration);
        }
    }, [onTimeout, onWarning, enabled]);

    const initializeEventSource = useCallback(() => {
        if (!enabled) return;

        // Close existing EventSource if any
        if (eventSourceRef.current) {
            console.log('Closing existing EventSource connection');
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        const eventSourceUrl = `${config.apiUrl}${SUBMIT_END_POINTS.sessionStatus}`;
        console.log('Connecting to SSE:', eventSourceUrl);

        const eventSource = new EventSource(eventSourceUrl, {
            withCredentials: true
        });

        eventSource.onopen = () => {
            console.log('SSE connection opened');
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('SSE message received:', data);

                if (data.status === 'active' && data.expire) {
                    setSessionStatus('live');
                    resetTimer(data.expire);
                } else if (data.status === 'terminated') {
                    setSessionStatus('terminated');
                    console.log('Session terminated via SSE');
                    if (onTimeout) {
                        onTimeout();
                    }
                }
            } catch (error) {
                console.error('Error parsing SSE message:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            
            // If the EventSource is in a closed state, clean up the reference
            if (eventSource.readyState === EventSource.CLOSED) {
                console.log('EventSource closed due to error, cleaning up reference');
                if (eventSourceRef.current === eventSource) {
                    eventSourceRef.current = null;
                }
            }
            
            // Don't immediately trigger timeout on connection error
            // The server will handle session validation
        };

        eventSourceRef.current = eventSource;
    }, [enabled, resetTimer, onTimeout]);

    const extendSession = useCallback(async () => {
        if (onStayLoggedIn) {
            try {
                await onStayLoggedIn();
                console.log('Session extended successfully');
                // The SSE will receive updated expiration time automatically
            } catch (error) {
                console.error('Keep alive failed:', error);
                // If keep alive fails, trigger timeout
                if (onTimeout) {
                    onTimeout();
                }
            }
        }
    }, [onStayLoggedIn, onTimeout]);

    const closeEventSource = useCallback(() => {
        if (eventSourceRef.current) {
            console.log('Manually closing EventSource connection');
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const events = ['mousedown', 'mousemove', 'keypress', 'touchstart', 'click'];
        
        const handleActivity = (event) => {
            // Check if the event originated from within the SessionTimeoutModal
            const target = event.target;
            const isFromModal = target.closest('.session-timeout-modal') || 
                               target.closest('.session-timeout-modal-overlay');
            
            // Ignore activity from the session timeout modal
            if (isFromModal) {
                return;
            }
            
            const now = Date.now();
            // If activity in last 2 seconds
            if (now - lastActivityRef.current > 2000 && onStayLoggedIn) {
                onStayLoggedIn();
                console.log('User activity detected, call KeepSession');
                lastActivityRef.current = now;
            }
        };

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        // Initialize SSE connection
        initializeEventSource();

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
            
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
            if (eventSourceRef.current) {
                console.log('Cleaning up EventSource connection');
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [initializeEventSource, enabled]);

    return {
        isWarning,
        expirationTime,
        sessionStatus,
        extendSession,
        closeEventSource,
        lastActivity: lastActivityRef.current
    };
};

export default useSessionTimeout;