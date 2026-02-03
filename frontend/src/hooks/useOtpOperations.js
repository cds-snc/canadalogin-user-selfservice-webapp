import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { otpFactors } from "../features/TransientOtp/api/otpFactors";
import { authService } from "../services/authService";
import { serverMapping } from "../utils/constants";

/**
 * Custom hook that provides common OTP operations used across multiple components
 * including MFA factor selection, OTP sending/validation, and user phone factor fetching
 */
export const useOtpOperations = (
  userId,
  userName,
  setErrorCode,
  fallbackNavigationPath,
) => {
  const [userPhoneFactors, setUserPhoneFactors] = useState([]);
  const [userSelectedMfaFactor, setUserSelectedMfaFactor] = useState(null);
  const [otpSentResponse, setOtpSentResponse] = useState(null);
  const [userOtpValue, setUserOtpValue] = useState("");
  const [localLoading, setLocalLoading] = useState(true);

  const navigate = useNavigate();
  const didFetch = useRef(false);

  /**
   * Handle MFA factor selection from the list of user phone factors
   */
  const handleChangeUserMfaSelection = (id) => {
    const selectedMfaFactor = userPhoneFactors.find(
      (factor) => factor.id === id,
    );

    if (selectedMfaFactor) {
      setUserSelectedMfaFactor(selectedMfaFactor);
    }
  };

  /**
   * Handle setting the OTP value entered by the user
   */
  const handleSetUserOtpValue = (value) => {
    setUserOtpValue(value);
  };

  /**
   * Request OTP code to be sent to the selected MFA factor or email
   * @param {string} overrideOtpType - Optional OTP type override
   * @param {string} targetEmailAddress - Optional target email address for email OTP
   */
  const requestOtpCode = async (overrideOtpType, targetEmailAddress) => {
    if (!userName) return;

    // Allow direct email OTP requests or use selected MFA factor
    const otpType =
      overrideOtpType ||
      (userSelectedMfaFactor
        ? serverMapping[userSelectedMfaFactor.type]
        : null);
    if (!otpType) return;

    const userData = {
      user_id: userId,
      otpType,
    };

    // Add phoneNumber for SMS/Voice OTP
    if (otpType !== "email" && userSelectedMfaFactor?.phoneNumber) {
      userData.phoneNumber = userSelectedMfaFactor.phoneNumber;
    }

    // Add emailAddress for email OTP when a target email is specified
    if (otpType === "email" && targetEmailAddress) {
      userData.emailAddress = targetEmailAddress;
    }

    try {
      const response = await authService.transientOtpSend(userData);
      if (response && response.success) {
        setOtpSentResponse(response.data);
        setErrorCode("");
      }
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    } finally {
      didFetch.current = false;
    }
  };

  /**
   * Validate OTP code entered by user
   * @param {string} otpValue - The OTP value to validate
   * @param {function} onSuccess - Callback function to execute on successful validation
   * @param {string} overrideOtpType - Optional OTP type override (for direct email OTP)
   */
  const validateOtpCode = async (otpValue, onSuccess, overrideOtpType) => {
    if (!otpSentResponse) return;

    // Determine OTP type: prioritize override, then selected MFA factor
    let otpType;
    if (overrideOtpType) {
      otpType = overrideOtpType;
    } else if (userSelectedMfaFactor) {
      otpType = serverMapping[userSelectedMfaFactor.type];
    } else {
      // If no override and no selected MFA factor, don't proceed
      return;
    }

    const userData = {
      otp: otpValue,
      trxnId: otpSentResponse.trxnId,
      otpType,
    };

    try {
      const response = await authService.transientOtpVerify(userData);
      if (response && response.success) {
        setErrorCode("");
        if (onSuccess) {
          onSuccess(response);
        }
      }
    } catch (err) {
      if (
        err &&
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        setErrorCode(err.response.data.message);
      }
    } finally {
      setUserOtpValue("");
    }
  };

  /**
   * Fetch user's OTP phone factors from the API
   */
  const fetchUserOtpPhoneFactors = async () => {
    if (!userId) return;

    setLocalLoading(true);
    try {
      const response = await otpFactors.getUserOtpPhoneFactors(userId);
      if (
        response &&
        response.success &&
        response.data.length > 0 &&
        response.data[0].type
      ) {
        const phoneFactors = response.data;
        setUserPhoneFactors(phoneFactors);
        setUserSelectedMfaFactor(phoneFactors[0]);
        return phoneFactors;
      } else {
        // If no phone factors available, redirect to fallback page
        if (fallbackNavigationPath) {
          navigate(fallbackNavigationPath);
        }
        return [];
      }
    } catch (err) {
      console.error("Error fetching user OTP phone factors:", err);
      if (fallbackNavigationPath) {
        navigate(fallbackNavigationPath);
      }
      return [];
    } finally {
      setLocalLoading(false);
    }
  };

  /**
   * Effect to fetch user phone factors when userId changes
   */
  useEffect(() => {
    if (userId) {
      fetchUserOtpPhoneFactors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    // State
    userPhoneFactors,
    userSelectedMfaFactor,
    otpSentResponse,
    userOtpValue,
    localLoading,

    // Setters
    setUserPhoneFactors,
    setUserSelectedMfaFactor,
    setOtpSentResponse,
    setUserOtpValue,
    setLocalLoading,

    // Functions
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    requestOtpCode,
    validateOtpCode,
    fetchUserOtpPhoneFactors,
  };
};
