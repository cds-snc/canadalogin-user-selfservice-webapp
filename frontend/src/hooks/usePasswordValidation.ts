import { useState } from "react";

import { authService } from "../services/authService";
import type { AuthServiceError, PasswordPolicyData } from "../types/services";
import type {
  PasswordValidationSuccessCallback,
  UsePasswordValidationReturn,
} from "../types/hooks";

function getErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const authError = error as AuthServiceError;
  return authError.data?.message ?? authError.response?.data?.message;
}

export function usePasswordValidation(
  setErrorCode: (errorCode: string) => void,
  onSuccess?: PasswordValidationSuccessCallback | null,
  useStepup: boolean = false,
): UsePasswordValidationReturn {
  const [validatePasswordLoading, setValidatePasswordLoading] = useState(false);

  const validatePassword = async (
    userPasswordValue: string | null | undefined,
  ): Promise<void> => {
    setValidatePasswordLoading(true);
    try {
      const passwordPolicyResponse = await authService.requestPasswordPolicy();
      const passwordPolicy = passwordPolicyResponse?.data as
        | PasswordPolicyData
        | undefined;

      if (passwordPolicyResponse?.success && passwordPolicy) {
        if (
          !userPasswordValue ||
          userPasswordValue.length < passwordPolicy.pwdMinLength ||
          userPasswordValue.length > passwordPolicy.pwdMaxLength
        ) {
          setErrorCode("5");
          return;
        }
      }

      const response = useStepup
        ? await authService.verifyPasswordForStepup({
            password: userPasswordValue ?? "",
          })
        : await authService.verifyPassword({
            password: userPasswordValue ?? "",
          });

      if (response?.success) {
        setErrorCode("");
        onSuccess?.();
      }
    } catch (err) {
      const message = getErrorMessage(err);
      if (message) {
        setErrorCode(message);
      }
    } finally {
      setValidatePasswordLoading(false);
    }
  };

  return { validatePassword, validatePasswordLoading };
}
