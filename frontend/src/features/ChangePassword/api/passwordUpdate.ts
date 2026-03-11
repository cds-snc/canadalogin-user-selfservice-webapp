import axios from "axios";

import config from "../../../config";
import { SUBMIT_END_POINTS } from "../../../utils/constants";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { OtpFactorReference, OtpSentData } from "../../../types/hooks";
import type {
  AuthServiceError,
  AuthServiceResponse,
} from "../../../types/services";

axios.defaults.withCredentials = true;

const passwordUpdateApi = `${config.apiUrl}${SUBMIT_END_POINTS.passwordUpdate}`;

type PasswordUpdateInitiateData = OtpSentData;
type PasswordUpdateValidateData = Record<string, unknown>;
type PasswordUpdateCompleteData = Record<string, unknown>;

interface PasswordUpdateContract {
  firstStep: (
    userName: string,
    userSelectedMfaFactor: OtpFactorReference,
  ) => Promise<AuthServiceResponse<PasswordUpdateInitiateData> | undefined>;
  secondStep: (
    userOtp: string,
    trxId: string,
  ) => Promise<AuthServiceResponse<PasswordUpdateValidateData> | undefined>;
  finalStep: (
    userOtp: string,
    trxId: string,
    password: string,
  ) => Promise<AuthServiceResponse<PasswordUpdateCompleteData> | undefined>;
}

export const passwordUpdate: PasswordUpdateContract = {
  firstStep: async (userName, userSelectedMfaFactor) => {
    try {
      const data = {
        userName,
        otpType: userSelectedMfaFactor.type,
        enrollmentId: userSelectedMfaFactor.id,
      };

      const response = await axios.post<
        AuthServiceResponse<PasswordUpdateInitiateData>
      >(`${passwordUpdateApi}/initiate`, data);
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
  secondStep: async (userOtp, trxId) => {
    try {
      const data = {
        otp: userOtp,
        trxId,
      };
      const response = await axios.post<
        AuthServiceResponse<PasswordUpdateValidateData>
      >(`${passwordUpdateApi}/validate`, data);
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
  finalStep: async (userOtp, trxId, password) => {
    try {
      const data = {
        otp: userOtp,
        trxId,
        password,
      };

      const response = await axios.put<
        AuthServiceResponse<PasswordUpdateCompleteData>
      >(`${passwordUpdateApi}/complete`, data);
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
};
