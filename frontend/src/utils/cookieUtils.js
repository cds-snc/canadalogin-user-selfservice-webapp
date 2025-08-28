// Cookie utility functions
export const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
};

export const formatTime = (date) => {
    if (!date) return '';
    
    return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
};

export const getSessionExpirationTime = () => {
    // Get the session-expiry cookie which contains the timestamp
    const sessionExpireCookie = getCookie('session-expiry');
    if (!sessionExpireCookie) {
        console.warn('session-expiry cookie not found');
        return null;
    }
    
    try {
        // Parse the timestamp from the cookie
        const timestamp = parseInt(sessionExpireCookie, 10);
        if (isNaN(timestamp)) {
            console.warn('Invalid timestamp in session-expiry cookie');
            return null;
        }
        
        // Create a Date object from the timestamp (timestamp is in seconds, convert to milliseconds)
        const expirationTime = new Date(timestamp * 1000);
        return expirationTime;
    } catch (error) {
        console.error('Error parsing session-expiry cookie:', error);
        return null;
    }
};
