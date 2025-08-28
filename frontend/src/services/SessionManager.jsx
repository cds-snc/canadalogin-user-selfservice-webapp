import React, { useState, useCallback } from 'react';
import useSessionTimeout from '../hooks/useSessionTimeout.jsx';
import SessionTimeoutModal from '../components/Layout/SessionTimeoutModal.jsx';
import LoadingModal from '../components/Layout/LoadingModal.jsx';
import { authService } from './authService.jsx';
import { getPageContent } from '../utils/functions.jsx';
import { useLanguage } from '../components/Providers/LanguageProvider.tsx';

const SessionManager = ({ children }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    const { state: languageState } = useLanguage();
    const currentLang = languageState.language || 'en';

    const pageContentJson = getPageContent(currentLang, "SessionTimeout");

    const handleLogout = useCallback(async () => {
        setIsModalOpen(false); // Close session timeout modal
        setIsLoggingOut(true);
         
        try {
            const response = await authService.logout();
            // Backend should return a redirect URL
            if (response && response.success && response.data) {
                window.location.href = response.data;
            } else {
                // Fallback to default logout behavior
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout failed:', error);
            // Fallback logout - redirect to home or login page
            window.location.href = '/';
        } finally {
            // setIsLoggingOut(false);
        }
    }, []);

    const handleWarning = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleTimeout = useCallback(() => {
        // Auto logout when time expires
        handleLogout();
    }, [handleLogout]);

    const handleKeepSession = useCallback(async () => {
        setIsLoading(true);
        try {
            await authService.keepAlive();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Keep alive failed:', error);
            // If keep alive fails, proceed with logout
            handleLogout();
        } finally {
            setIsLoading(false);
        }
    }, [handleLogout]);


    const {
        expirationTime,
    } = useSessionTimeout({
        onTimeout: handleTimeout,
        onWarning: handleWarning,
        onStayLoggedIn: handleKeepSession,
        enabled: true
    });



    return (
        <>
            {children}
            <SessionTimeoutModal
                isOpen={isModalOpen}
                expirationTime={expirationTime}
                onKeepSession={handleKeepSession}
                onLogout={handleLogout}
                isLoading={isLoading}
                currentLang={currentLang}
            />
            <LoadingModal
                isOpen={isLoggingOut}
                message={pageContentJson['7']} // "Logging you out..."
            />
        </>
    );
};

export default SessionManager;
