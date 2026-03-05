import { useState, useEffect } from "react";
import { fetchUserFIDO2Credentials } from "../features/ManageFIDO2/utils/fetchUserFIDO2Credentials";

/**
 * Custom hook that handles fetching and managing FIDO2 passkey credentials.
 * @param {Object} options
 * @param {Function} [options.setErrorCode] - Optional function to set error codes
 * @param {boolean} [options.enabled=true] - Set to false to skip the fetch (e.g. behind a feature flag)
 */
export const usePasskeyOperations = ({ setErrorCode, enabled = true } = {}) => {
  const [fido2Data, setFido2Data] = useState([]);
  // Start loading=true when enabled so callers never see a flash of un-loaded
  // content before the first useEffect tick fires.
  const [loading, setLoading] = useState(enabled);

  const fetch = async () => {
    await fetchUserFIDO2Credentials({
      setLoading,
      setData: setFido2Data,
      setErrorCode,
    });
  };

  useEffect(() => {
    if (!enabled) return;
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    fido2Data,
    loading,
    refetch: fetch,
  };
};
