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
}

export const deleteMFAPhoneNumberApi = {
  // Delete an MFA OTP phone number with OTP verification
  deleteMFA: async ({
    id,
    otpType,
    otp,
    trxnId,
    otpVerificationType,
  }: DeleteMFAParams): Promise<unknown> => {
    try {
      const response = await axios.delete(
        `${config.apiUrl}${SUBMIT_END_POINTS.mfaDelete}`,
        {
          data: {
            id,
            otpType,
            otp,
            trxnId,
            otpVerificationType,
          },
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
};
