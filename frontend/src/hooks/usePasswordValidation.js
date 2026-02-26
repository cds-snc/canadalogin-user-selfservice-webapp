import { useState } from "react";
import { authService } from "../services/authService";

/**
 * Custom hook for password validation
 * @param {Function} setErrorCode - Function to set error codes
 * @param {Function} onSuccess - Callback function to execute on successful validation
 * @param {boolean} useStepup - If true, uses stepup endpoint for FIDO2 token exchange
 * @returns {Object} - Object containing validatePassword function and loading state
 */
export function usePasswordValidation(
  setErrorCode,
  onSuccess,
  useStepup = false,
) {
  const [validatePasswordLoading, setValidatePasswordLoading] = useState(false);
  const validatePassword = async (userPasswordValue) => {
    setValidatePasswordLoading(true);
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

      // Verify password with backend (use stepup endpoint if requested)
      const response = useStepup
        ? await authService.verifyPasswordForStepup({
            password: userPasswordValue,
          })
        : await authService.verifyPassword({
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
    } finally {
      setValidatePasswordLoading(false);
    }
  };

  return { validatePassword, validatePasswordLoading };
}
