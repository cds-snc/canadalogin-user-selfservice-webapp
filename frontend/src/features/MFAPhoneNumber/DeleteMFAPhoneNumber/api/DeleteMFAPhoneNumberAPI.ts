import axios from "axios";
import config from "../../../../config";
import { handleApiError } from "../../../../utils/apiErrorHandler";
import { SUBMIT_END_POINTS } from "../../../../utils/constants";
import { ApiErrorLike } from "../../../../types/utils";

axios.defaults.withCredentials = true;

interface DeleteMFAParams {
  id: string;
  otpType: string;
  otp?: string;
  trxnId?: string;
  otpVerificationType?: string;
  assertionResult?: unknown;
}

interface DeleteMFABatchFactor {
  id: string;
  otpType: string;
}

interface DeleteMFABatchParams {
  factors: DeleteMFABatchFactor[];
  otp?: string;
  trxnId?: string;
  otpVerificationType?: string;
  assertionResult?: unknown;
}

export const deleteMFAPhoneNumberApi = {
  // Delete an MFA OTP phone number with OTP verification
  deleteMFA: async ({
    id,
    otpType,
    otp,
    trxnId,
    otpVerificationType,
    assertionResult,
  }: DeleteMFAParams): Promise<unknown> => {
    try {
      const data = {
        id,
        otpType,
        ...(assertionResult ? { assertionResult } : {}),
        ...(otp !== undefined ? { otp } : {}),
        ...(trxnId !== undefined ? { trxnId } : {}),
        ...(otpVerificationType !== undefined ? { otpVerificationType } : {}),
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
    otp,
    trxnId,
    otpVerificationType,
    assertionResult,
  }: DeleteMFABatchParams): Promise<unknown> => {
    try {
      const data = {
        factors,
        ...(assertionResult ? { assertionResult } : {}),
        ...(otp !== undefined ? { otp } : {}),
        ...(trxnId !== undefined ? { trxnId } : {}),
        ...(otpVerificationType !== undefined ? { otpVerificationType } : {}),
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
};
