import { fido2Api } from "../api/fido2Api";

/**
 * Fetches user's FIDO2 credentials and handles the response
 * @param {Object} options - Configuration options
 * @param {Function} options.setLoading - Function to set loading state
 * @param {Function} options.setData - Function to set FIDO2 credentials data
 * @param {Function} [options.setErrorCode] - Optional function to set error code
 * @param {Function} [options.onError] - Optional callback for error handling
 * @returns {Promise<void>}
 */
export const fetchUserFIDO2Credentials = async ({
  setLoading,
  setData,
  setErrorCode,
  onError,
}) => {
  setLoading(true);
  if (setErrorCode) {
    setErrorCode("");
  }

  try {
    const response = await fido2Api.getUserFIDO2Credentials();
    if (response && response?.success) {
      setData(response?.data?.fido2 || []);
    }
  } catch (error) {
    if (error && error.data && error.data.message) {
      if (setErrorCode) {
        setErrorCode(error.data.message);
      }
      if (onError) {
        onError(error);
      }
    } else if (onError) {
      onError(error);
    }
  } finally {
    setLoading(false);
  }
};
