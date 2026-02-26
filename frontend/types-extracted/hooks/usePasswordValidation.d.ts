/**
 * Custom hook for password validation
 * @param {Function} setErrorCode - Function to set error codes
 * @param {Function} onSuccess - Callback function to execute on successful validation
 * @param {boolean} useStepup - If true, uses stepup endpoint for FIDO2 token exchange
 * @returns {Object} - Object containing validatePassword function and loading state
 */
export function usePasswordValidation(setErrorCode: Function, onSuccess: Function, useStepup?: boolean): any;
