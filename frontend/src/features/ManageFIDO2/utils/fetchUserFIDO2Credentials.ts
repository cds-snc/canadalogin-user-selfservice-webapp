import { fido2Api } from "../api/fido2Api";
import type { Fido2Credential } from "../../../types/hooks";

interface FetchUserFIDO2CredentialsOptions {
  setLoading: (loading: boolean) => void;
  setData: (data: Fido2Credential[]) => void;
  setErrorCode?: (code: string) => void;
  onError?: (error: unknown) => void;
}

/**
 * Fetches user's FIDO2 credentials and handles the response
 */
export const fetchUserFIDO2Credentials = async ({
  setLoading,
  setData,
  setErrorCode,
  onError,
}: FetchUserFIDO2CredentialsOptions): Promise<void> => {
  setLoading(true);
  if (setErrorCode) {
    setErrorCode("");
  }

  try {
    const response = (await fido2Api.getUserFIDO2Credentials()) as
      | { success?: boolean; data?: { fido2?: unknown[] } }
      | undefined;
    if (response && response?.success) {
      setData((response?.data?.fido2 || []) as Fido2Credential[]);
    }
  } catch (error) {
    const err = error as { data?: { message?: string } };
    if (err && err.data && err.data.message) {
      if (setErrorCode) {
        setErrorCode(err.data.message);
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
