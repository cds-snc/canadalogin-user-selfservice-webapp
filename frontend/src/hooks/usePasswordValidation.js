import { authService } from "../services/authService";

/**
 * Custom hook for password validation
 * @param {Function} setErrorCode - Function to set error codes
 * @param {Function} onSuccess - Callback function to execute on successful validation
 * @returns {Object} - Object containing validatePassword function and loading state
 */
export function usePasswordValidation(setErrorCode, onSuccess) {
  const validatePassword = async (userPasswordValue) => {
    try {
      // Get password policy first
      const passwordPolicyResponse = await authService.requestPasswordPolicy();
      if (passwordPolicyResponse.success) {
        const passwordPolicy = {
          min: passwordPolicyResponse.data.pwdMinLength,
          max: passwordPolicyResponse.data.pwdMaxLength,
        };

        // Check password length against policy
        if (
          !userPasswordValue ||
          userPasswordValue.length < passwordPolicy.min ||
          userPasswordValue.length > passwordPolicy.max
        ) {
          setErrorCode("5");
          return;
        }
      }

      // Verify password with backend
      const response = await authService.verifyPassword({
        password: userPasswordValue,
      });

      if (response && response.success) {
        setErrorCode("");
        // Call the success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    }
  };

  return { validatePassword };
}
