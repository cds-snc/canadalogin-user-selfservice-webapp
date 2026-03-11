import axios from "axios";

import config from "../../../config";
import { SUBMIT_END_POINTS } from "../../../utils/constants";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { OtpFactor } from "../../../types/hooks";
import type {
  AuthServiceError,
  AuthServiceResponse,
} from "../../../types/services";

axios.defaults.withCredentials = true;

interface ChangePasswordOtpFactorsContract {
  getUserOtpPhoneFactors: (
    userId: string,
  ) => Promise<AuthServiceResponse<OtpFactor[]> | undefined>;
}

export const otpFactors: ChangePasswordOtpFactorsContract = {
  getUserOtpPhoneFactors: async (userId) => {
    try {
      const response = await axios.get<AuthServiceResponse<OtpFactor[]>>(
        `${config.apiUrl}${SUBMIT_END_POINTS.users}/${userId}/otp_factors`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
};
