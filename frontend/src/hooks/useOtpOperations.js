import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { otpFactors } from "../features/TransientOtp/api/otpFactors";
import { authService } from "../services/authService";
import { serverMapping } from "../utils/constants";

export const MAP_TYPES = {
  lastFourDigits: "lastFourDigits",
  fullPhoneNumber: "fullPhoneNumber",
};

/**
 * Custom hook that provides common OTP operations used across multiple components
 * including MFA factor selection, OTP sending/validation, and user phone factor fetching
 * @param {string} userId - The user ID
 * @param {string} userName - The user name
 * @param {Function} setErrorCode - Function to set error codes
 * @param {string} fallbackNavigationPath - Path to navigate on error
 * @param {string} mapType - Type of phone factors map to create ('lastFourDigits' or 'fullPhoneNumber')
 * @param {string} mfaTrxnId - MFA enrollment trxnId if calling from the Add MFA flow
 * @param {bool} externalLoading - caller-owned loading flag ORed into localLoading.
 *   Pass true when the caller has its own async fetch that starts on mount so that
 *   localLoading begins true from the very first render, preventing a flash of
 *   un-loaded content before the first useEffect tick fires.
 */
export const useOtpOperations = ({
  userId,
  userName,
  setErrorCode,
  fallbackNavigationPath,
  mapType = null,
  mfaTrxnId = "",
}) => {
  const [userPhoneFactors, setUserPhoneFactors] = useState([]);
  const [userSelectedMfaFactor, setUserSelectedMfaFactor] = useState(null);
  const [otpSentResponse, setOtpSentResponse] = useState(null);
  const [userOtpValue, setUserOtpValue] = useState("");
  // Two independent loading flags to prevent flashing UI:
  // - otpLoading: owned by the OTP phone factors fetch inside this hook.
  //   Initialised to true when userId is present so the screen starts in the
  //   loading state before the first useEffect tick fires.
  // - externalLoadingState: mirrors the caller-supplied externalLoading initial
  //   value and can be updated via setLocalLoading for subsequent operations
  //   (e.g. logout, enrollMFA). The caller is responsible for supplying the
  //   correct initial value so the screen never briefly renders un-loaded.
  // localLoading is true as long as either flag is true.
  const [otpLoading, setOtpLoading] = useState(!!userId);
  const [phoneFactorsMap, setPhoneFactorsMap] = useState({});

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
   * @param {object} override - Optional OTP override
   */
  const requestOtpCode = async (override) => {
    if (!userName) return;

    let userData;

    if (userSelectedMfaFactor) {
      userData = {
        user_id: userId,
        otpType: serverMapping[userSelectedMfaFactor.type],
        factor_id: userSelectedMfaFactor.id,
      };
    }

    if (override) {
      userData = {
        user_id: userId,
        otpType: override.otpType,
        destination: override.destination,
      };
    }

    if (!userData) return;

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
   * Create a phone factors map with customizable transformation
   * @param {Array} phoneFactors - Array of phone factors
   * @param {string} mapType - Type of map to create ('lastFourDigits' or 'fullPhoneNumber')
   * @returns {Object} Phone factors map
   */
  const createPhoneFactorsMap = (phoneFactors, mapType = "lastFourDigits") => {
    return phoneFactors.reduce((acc, factor) => {
      if (mapType === MAP_TYPES.lastFourDigits) {
        // For AddMFAPage: key is last 4 digits, value is array of types
        const visibleDigits = factor.destination.slice(-4);
        acc[visibleDigits] = acc[visibleDigits]
          ? [...acc[visibleDigits], factor.type]
          : [factor.type];
      } else if (mapType === MAP_TYPES.fullPhoneNumber) {
        // For Manage2FAVerifications: key is full phone number, value is array of {type, id}
        acc[factor.destination] = acc[factor.destination]
          ? [...acc[factor.destination], { type: factor.type, id: factor.id }]
          : [{ type: factor.type, id: factor.id }];
      }
      return acc;
    }, {});
  };

  /**
   * Fetch user's OTP phone factors from the API
   * @param {Object} options - Optional configuration
   * @param {string} options.mapType - Type of phone factors map to create (overrides hook's mapType)
   * @returns {Object} Object containing phoneFactors and phoneFactorsMap
   */
  const fetchUserOtpPhoneFactors = async () => {
    if (!userId) return { phoneFactors: [], phoneFactorsMap: {} };

    setOtpLoading(true);
    try {
      const response = await otpFactors.getUserOtpPhoneFactors();
      if (
        response &&
        response.success &&
        response.data.length > 0 &&
        response.data[0].type
      ) {
        const phoneFactors = response.data;
        setUserPhoneFactors(phoneFactors);
        setUserSelectedMfaFactor(phoneFactors[0]);

        const factorsMap = mapType
          ? createPhoneFactorsMap(phoneFactors, mapType)
          : {};

        // Update state if mapType is provided
        if (mapType) {
          setPhoneFactorsMap(factorsMap);
        }
      } else {
        if (fallbackNavigationPath) {
          navigate(fallbackNavigationPath);
        }
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

  /**
   * Effect to fetch user phone factors when userId changes
   */
  useEffect(() => {
    if (userId) {
      fetchUserOtpPhoneFactors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, mfaTrxnId]);

  return {
    // State
    userPhoneFactors,
    userSelectedMfaFactor,
    otpSentResponse,
    userOtpValue,
    otpLoading,
    phoneFactorsMap,

    // Setters
    setUserPhoneFactors,
    setUserSelectedMfaFactor,
    setOtpSentResponse,
    setUserOtpValue,
    setOtpLoading,

    // Functions
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    requestOtpCode,
    validateOtpCode,
    fetchUserOtpPhoneFactors,
    createPhoneFactorsMap,
  };
};
