import axios from "axios";
import config from "../../../../config";
import { handleApiError } from "../../../../utils/apiErrorHandler";
import { SUBMIT_END_POINTS } from "../../../../utils/constants";
import { ApiErrorLike } from "../../../../types/utils";

axios.defaults.withCredentials = true;

interface DeleteMFAParams {
  id: string;
  otpType: string;
  action?: "verify" | "commit" | "commit_with_verification";
  otp?: string;
  trxnId?: string;
  otpVerificationType?: string;
  assertionResult?: unknown;
  verificationProofId?: string;
}

interface DeleteMFABatchFactor {
  id: string;
  otpType: string;
}

interface DeleteMFABatchParams {
  factors: DeleteMFABatchFactor[];
  action?: "verify" | "commit" | "commit_with_verification";
  otp?: string;
  trxnId?: string;
  otpVerificationType?: string;
  assertionResult?: unknown;
  verificationProofId?: string;
}

interface DeletionVerificationData {
  verificationProofId?: string;
  expiresIn?: number;
}

interface DeletionVerificationResponse {
  success?: boolean;
  data?: DeletionVerificationData;
}

export const deleteMFAPhoneNumberApi = {
  // Delete an MFA OTP phone number with OTP verification
  deleteMFA: async ({
    id,
    otpType,
    action,
    otp,
    trxnId,
    otpVerificationType,
    assertionResult,
    verificationProofId,
  }: DeleteMFAParams): Promise<unknown> => {
    try {
      const data = {
        id,
        otpType,
        ...(action !== undefined ? { action } : {}),
        ...(assertionResult ? { assertionResult } : {}),
        ...(otp !== undefined ? { otp } : {}),
        ...(trxnId !== undefined ? { trxnId } : {}),
        ...(otpVerificationType !== undefined ? { otpVerificationType } : {}),
        ...(verificationProofId !== undefined ? { verificationProofId } : {}),
      };

      const response = await axios.delete(
        `${config.apiUrl}${SUBMIT_END_POINTS.mfaDelete}`,
        {
          data,
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  // Delete multiple MFA OTP phone number factors with a single OTP verification
  deleteMFABatch: async ({
    factors,
    action,
    otp,
    trxnId,
    otpVerificationType,
    assertionResult,
    verificationProofId,
  }: DeleteMFABatchParams): Promise<unknown> => {
    try {
      const data = {
        factors,
        ...(action !== undefined ? { action } : {}),
        ...(assertionResult ? { assertionResult } : {}),
        ...(otp !== undefined ? { otp } : {}),
        ...(trxnId !== undefined ? { trxnId } : {}),
        ...(otpVerificationType !== undefined ? { otpVerificationType } : {}),
        ...(verificationProofId !== undefined ? { verificationProofId } : {}),
      };

      const response = await axios.delete(
        `${config.apiUrl}${SUBMIT_END_POINTS.mfaDeleteBatch}`,
        {
          data,
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  verifyDeleteMFA: async (
    params: DeleteMFAParams,
  ): Promise<DeletionVerificationResponse | undefined> => {
    return (await deleteMFAPhoneNumberApi.deleteMFA({
      ...params,
      action: "verify",
    })) as DeletionVerificationResponse | undefined;
  },

  verifyDeleteMFABatch: async (
    params: DeleteMFABatchParams,
  ): Promise<DeletionVerificationResponse | undefined> => {
    return (await deleteMFAPhoneNumberApi.deleteMFABatch({
      ...params,
      action: "verify",
    })) as DeletionVerificationResponse | undefined;
  },
};
