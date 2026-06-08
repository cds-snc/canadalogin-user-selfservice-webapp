import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { otpFactors } from "../features/TransientOtp/api/otpFactors";
import { authService } from "../services/authService";
import { serverMapping } from "../utils/constants";
import type { AuthServiceError } from "../types/services";
import type {
  OtpFactor,
  OtpMapType,
  OtpRequestOverride,
  OtpSentData,
  PhoneFactorsMap,
  UseOtpOperationsOptions,
  UseOtpOperationsReturn,
  UseOtpValidationSuccess,
} from "../types/hooks";

export const MAP_TYPES = {
  lastFourDigits: "lastFourDigits",
  fullPhoneNumber: "fullPhoneNumber",
} as const satisfies Record<OtpMapType, OtpMapType>;

function getErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const authError = error as AuthServiceError;
  return authError.data?.message ?? authError.response?.data?.message;
}

function mapFactorTypeToServerOtpType(factorType: string): string {
  return serverMapping[factorType as keyof typeof serverMapping] ?? factorType;
}

export const useOtpOperations = ({
  userId,
  userName,
  setErrorCode,
  fallbackNavigationPath,
  allowEmptyFactors = false,
  mapType = null,
  mfaTrxnId = "",
}: UseOtpOperationsOptions): UseOtpOperationsReturn => {
  const [userPhoneFactors, setUserPhoneFactors] = useState<OtpFactor[]>([]);
  const [userSelectedMfaFactor, setUserSelectedMfaFactor] =
    useState<OtpFactor | null>(null);
  const [otpSentResponse, setOtpSentResponse] = useState<OtpSentData | null>(
    null,
  );
  const [userOtpValue, setUserOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(Boolean(userId));
  const [phoneFactorsMap, setPhoneFactorsMap] = useState<PhoneFactorsMap>({});

  const navigate = useNavigate();
  const didFetch = useRef(false);
  const userSelectedMfaFactorRef = useRef<OtpFactor | null>(null);

  const handleChangeUserMfaSelection = (id: string): void => {
    const selectedMfaFactor = userPhoneFactors.find(
      (factor) => factor.id === id,
    );

    if (selectedMfaFactor) {
      setUserSelectedMfaFactor(selectedMfaFactor);
      userSelectedMfaFactorRef.current = selectedMfaFactor;
    }
  };

  const handleSetUserOtpValue = (value: string): void => {
    setUserOtpValue(value);
  };

  const requestOtpCode = async (
    override?: OtpRequestOverride,
    onError?: (errorCode: string) => void,
  ): Promise<boolean> => {
    if (!userName) {
      return false;
    }

    let userData:
      | {
          user_id: string | null | undefined;
          otpType: string;
          factor_id?: string;
          destination?: string;
        }
      | undefined;

    const currentFactor = userSelectedMfaFactorRef.current;
    if (currentFactor && !override) {
      userData = {
        user_id: userId,
        otpType: mapFactorTypeToServerOtpType(currentFactor.type),
        factor_id: currentFactor.id,
      };
    }

    if (override) {
      userData = {
        user_id: userId,
        otpType: override.otpType,
        destination: override.destination,
      };
    }

    if (!userData) {
      return false;
    }

    try {
      const response = await authService.transientOtpSend(userData);
      if (response?.success) {
        setOtpSentResponse((response.data ?? null) as OtpSentData | null);
        setErrorCode("");
        return true;
      }
      return false;
    } catch (err) {
      const message =
        getErrorMessage(err) ||
        (err instanceof Error ? err.message : undefined);
      if (message) {
        setErrorCode(message);
        onError?.(message);
      }
      return false;
    } finally {
      didFetch.current = false;
    }
  };

  const validateOtpCode = async (
    otpValue: string,
    onSuccess?: UseOtpValidationSuccess,
    overrideOtpType?: string,
    onError?: (errorCode: string) => void,
  ): Promise<void> => {
    if (!otpSentResponse) {
      return;
    }

    let otpType: string | undefined;
    if (overrideOtpType) {
      otpType = overrideOtpType;
    } else if (userSelectedMfaFactor) {
      otpType = mapFactorTypeToServerOtpType(userSelectedMfaFactor.type);
    } else {
      return;
    }

    const userData = {
      otp: otpValue,
      trxnId: otpSentResponse.trxnId,
      otpType,
    };

    try {
      const response = await authService.transientOtpVerify(userData);
      if (response?.success) {
        setErrorCode("");
        onSuccess?.(response);
      }
    } catch (err) {
      // If the error contains retries info, re-throw so OtpVerification
      // can display "X retries remaining" instead of a generic error
      const errObj = err as {
        response?: { data?: { retries?: number; message?: string } };
      };
      if (errObj?.response?.data?.retries !== undefined) {
        throw errObj.response;
      }

      const message =
        getErrorMessage(err) ||
        (err instanceof Error ? err.message : undefined);
      if (message) {
        setErrorCode(message);
        onError?.(message);
      }
    } finally {
      setUserOtpValue("");
    }
  };

  const createPhoneFactorsMap = (
    phoneFactors: OtpFactor[],
    selectedMapType: OtpMapType = MAP_TYPES.lastFourDigits,
  ): PhoneFactorsMap => {
    return phoneFactors.reduce<PhoneFactorsMap>((acc, factor) => {
      if (selectedMapType === MAP_TYPES.lastFourDigits) {
        const visibleDigits = factor.destination.slice(-4);
        const current = (acc[visibleDigits] as string[] | undefined) ?? [];
        acc[visibleDigits] = [...current, factor.type];
      } else if (selectedMapType === MAP_TYPES.fullPhoneNumber) {
        const current =
          (acc[factor.destination] as
            | { type: string; id: string }[]
            | undefined) ?? [];
        acc[factor.destination] = [
          ...current,
          { type: factor.type, id: factor.id },
        ];
      }

      return acc;
    }, {});
  };

  const fetchUserOtpPhoneFactors = async (): Promise<{
    phoneFactors: OtpFactor[];
    phoneFactorsMap: PhoneFactorsMap;
  } | void> => {
    if (!userId) {
      return { phoneFactors: [], phoneFactorsMap: {} };
    }

    setOtpLoading(true);
    try {
      const response = await otpFactors.getUserOtpPhoneFactors();
      const phoneFactors = Array.isArray(response?.data)
        ? (response.data as OtpFactor[])
        : [];

      if (
        response?.success &&
        phoneFactors.length > 0 &&
        phoneFactors[0]?.type
      ) {
        setUserPhoneFactors(phoneFactors);
        setUserSelectedMfaFactor(phoneFactors[0]);
        userSelectedMfaFactorRef.current = phoneFactors[0];

        const factorsMap = mapType
          ? createPhoneFactorsMap(phoneFactors, mapType)
          : {};

        if (mapType) {
          setPhoneFactorsMap(factorsMap);
        }

        return { phoneFactors, phoneFactorsMap: factorsMap };
      }

      if (allowEmptyFactors) {
        setUserPhoneFactors([]);
        userSelectedMfaFactorRef.current = null;
        setUserSelectedMfaFactor(null);
        if (mapType) {
          setPhoneFactorsMap({});
        }
        return { phoneFactors: [], phoneFactorsMap: {} };
      }

      if (fallbackNavigationPath) {
        navigate(fallbackNavigationPath);
      }
    } catch (err) {
      console.error("Error fetching user OTP phone factors:", err);
      if (fallbackNavigationPath) {
        navigate(fallbackNavigationPath);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  useEffect(() => {
    if (userId && !didFetch.current) {
      didFetch.current = true;
      void fetchUserOtpPhoneFactors();
    }

    return () => {
      didFetch.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, mfaTrxnId]);

  return {
    userPhoneFactors,
    userSelectedMfaFactor,
    userSelectedMfaFactorRef,
    otpSentResponse,
    userOtpValue,
    otpLoading,
    phoneFactorsMap,
    setUserPhoneFactors,
    setUserSelectedMfaFactor,
    setOtpSentResponse,
    setUserOtpValue,
    setOtpLoading,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    requestOtpCode,
    validateOtpCode,
    fetchUserOtpPhoneFactors,
    createPhoneFactorsMap,
  };
};
