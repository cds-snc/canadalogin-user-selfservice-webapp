import axios from "axios";
import config from "../../../config";
import { SUBMIT_END_POINTS } from "../../../utils/constants";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { OtpFactor } from "../../../types/hooks";
import type { ApiErrorLike } from "../../../types/utils";

axios.defaults.withCredentials = true;
const passwordUpdateApi = `${config.apiUrl}${SUBMIT_END_POINTS.passwordUpdate}`;

export type PasswordUpdateTransactionData = {
  trxId: string;
  [key: string]: unknown;
};

export type PasswordUpdateApiResponse<TData = unknown> = {
  success: boolean;
  message?: string;
  data?: TData;
  [key: string]: unknown;
};

export const passwordUpdate = {
  firstStep: async (
    userName: string | null | undefined,
    userSelectedMfaFactor: OtpFactor | null,
  ): Promise<
    PasswordUpdateApiResponse<PasswordUpdateTransactionData> | undefined
  > => {
    if (!userName || !userSelectedMfaFactor) {
      return undefined;
    }

    try {
      const data = {
        userName,
        otpType: userSelectedMfaFactor.type,
        enrollmentId: userSelectedMfaFactor.id,
      };

      const response = await axios.post<
        PasswordUpdateApiResponse<PasswordUpdateTransactionData>
      >(`${passwordUpdateApi}/initiate`, data);
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
  secondStep: async (
    userOtp: string,
    trxId: string,
  ): Promise<PasswordUpdateApiResponse | undefined> => {
    try {
      const data = {
        otp: userOtp,
        trxId,
      };
      const response = await axios.post<PasswordUpdateApiResponse>(
        `${passwordUpdateApi}/validate`,
        data,
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
  finalStep: async (
    userOtp: string,
    trxId: string,
    password: string,
  ): Promise<PasswordUpdateApiResponse | undefined> => {
    try {
      const data = {
        otp: userOtp,
        trxId,
        password,
      };

      const response = await axios.put<PasswordUpdateApiResponse>(
        `${passwordUpdateApi}/complete`,
        data,
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
};
