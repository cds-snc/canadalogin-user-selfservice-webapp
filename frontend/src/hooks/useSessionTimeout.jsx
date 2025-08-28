import { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionExpirationTime } from '../utils/cookieUtils.js';

const useSessionTimeout = ({
    onTimeout,
    onWarning,
    onStayLoggedIn,
    enabled = true
}) => {
    const [isWarning, setIsWarning] = useState(false);
    const [expirationTime, setExpirationTime] = useState(null);
    const timeoutRef = useRef(null);
    const warningTimeoutRef = useRef(null);
    const checkIntervalRef = useRef(null);
    const activityCheckIntervalRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    const resetTimer = useCallback(() => {
        // Clear existing timers
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
        }
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
        }
        if (activityCheckIntervalRef.current) {
            clearInterval(activityCheckIntervalRef.current);
        }

        // Reset warning state
        setIsWarning(false);
        lastActivityRef.current = Date.now();

        if (!enabled) return;

        // Get session expiration time from cookie
        const sessionExpiration = getSessionExpirationTime();
        if (!sessionExpiration) {
            console.warn('No session expiration time found, session timeout disabled');
            return;
        }

        setExpirationTime(sessionExpiration);
        console.log('Session expiration time:', sessionExpiration.toLocaleString());

        const now = new Date();
        const timeUntilExpiration = sessionExpiration.getTime() - now.getTime();
        
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
        
        const warningTime = Math.max(0, timeUntilExpiration - (19.7 * 60 * 1000)); // Show warning 2 minutes before expiration

        // Set warning timer (2 minutes before expiration)
        // Only show warning if we have more than 2 minutes total time
        if (timeUntilExpiration > (2 * 60 * 1000) && warningTime > 0) {
            warningTimeoutRef.current = setTimeout(() => {
                setIsWarning(true);
                if (onWarning) {
                    onWarning();
                }
            }, warningTime);
        } else if (timeUntilExpiration <= (2 * 60 * 1000) && timeUntilExpiration > 0) {
            // If less than 2 minutes remaining but more than 0, show warning immediately
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

        // Start checking for cookie changes every 30 seconds
        checkIntervalRef.current = setInterval(() => {
            const currentExpiration = getSessionExpirationTime();
            if (currentExpiration) {
                resetTimer();
            } else {
                // Session cookie was removed, trigger timeout
                if (onTimeout) {
                    onTimeout();
                }
            }
        }, 10000);

        // Start checking for user activity every 10 seconds
        activityCheckIntervalRef.current = setInterval(async () => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivityRef.current;

            // If there was activity in the past 5 seconds (5000ms)
            if (timeSinceLastActivity < 5000) {
                console.log('User activity detected in past minute, extending session');
                
                // Call the "Stay logged in" function to extend session
                if (onStayLoggedIn) {
                    try {
                        await onStayLoggedIn();
                        resetTimer();

                    } catch (error) {
                        console.error('Keep alive failed:', error);
                        // If keep alive fails, trigger timeout
                        if (onTimeout) {
                            onTimeout();
                        }
                    }
                }
            }
        }, 5000); // Check every 10 seconds

    }, [onTimeout, onWarning, onStayLoggedIn, enabled]);

    const extendSession = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

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
            // Just track activity time, don't automatically reset timer
            // The activity check interval will handle session extension
            lastActivityRef.current = now;
            console.log('User activity detected, updating last activity time');
        };

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        // Initial timer setup
        resetTimer();

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
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
            if (activityCheckIntervalRef.current) {
                clearInterval(activityCheckIntervalRef.current);
            }
        };
    }, [resetTimer, enabled]);

    return {
        isWarning,
        expirationTime,
        extendSession,
        resetTimer
    };
};

export default useSessionTimeout;
