import { fido2Api } from "../api/fido2Api";
import type { Fido2Credential } from "../../../types/fido2";

export type FetchFIDO2Options = {
  setLoading: (v: boolean) => void;
  setData: (data: Fido2Credential[]) => void;
  setErrorCode?: (err: string) => void;
  onError?: (err: any) => void;
};

/**
 * Fetches user's FIDO2 credentials and handles the response
 */
export const fetchUserFIDO2Credentials = async ({
  setLoading,
  setData,
  setErrorCode,
  onError,
}: FetchFIDO2Options): Promise<void> => {
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
    // error shape varies; preserve existing runtime handling
    // prefer accessing known fields safely
    // @ts-ignore - legacy error shapes
    if (error && error.data && error.data.message) {
      if (setErrorCode) {
        // @ts-ignore
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
