import axios from "axios";
import config from "../../../config";
import { SUBMIT_END_POINTS } from "../../../utils/constants";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { OtpFactor } from "../../../types/hooks";
import type { ApiErrorLike } from "../../../types/utils";

axios.defaults.withCredentials = true;

type OtpFactorsApiResponse = {
  success: boolean;
  data: OtpFactor[];
};

export const otpFactors = {
  getUserOtpPhoneFactors: async (
    userId: string,
  ): Promise<OtpFactorsApiResponse | undefined> => {
    try {
      const response = await axios.get<OtpFactorsApiResponse>(
        `${config.apiUrl}${SUBMIT_END_POINTS.users}/${userId}/otp_factors`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
};
