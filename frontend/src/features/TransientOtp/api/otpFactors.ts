import axios from "axios";
import config from "../../../config";
import { SUBMIT_END_POINTS } from "../../../utils/constants";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { OtpFactor } from "../../../types/hooks";
import type { ApiErrorLike } from "../../../types/utils";

axios.defaults.withCredentials = true;

export const otpFactors = {
  getUserOtpPhoneFactors: async (validated = true): Promise<OtpFactor[]> => {
    try {
      const response = await axios.get<OtpFactor[]>(
        `${config.apiUrl}${SUBMIT_END_POINTS.users}/otp_factors`,
        {
          params: {
            validated: validated,
          },
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
};
