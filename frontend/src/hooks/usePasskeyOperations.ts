import { useEffect, useState } from "react";

import { fetchUserFIDO2Credentials } from "../features/ManageFIDO2/utils/fetchUserFIDO2Credentials";
import type {
  Fido2Credential,
  UsePasskeyOperationsOptions,
  UsePasskeyOperationsReturn,
} from "../types/hooks";

export const usePasskeyOperations = ({
  setErrorCode,
  enabled = true,
}: UsePasskeyOperationsOptions = {}): UsePasskeyOperationsReturn => {
  const [fido2Data, setFido2Data] = useState<Fido2Credential[]>([]);
  const [loading, setLoading] = useState(enabled);

  const fetch = async (): Promise<void> => {
    await fetchUserFIDO2Credentials({
      setLoading,
      setData: setFido2Data,
      setErrorCode,
    });
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    fido2Data,
    loading,
    refetch: fetch,
  };
};
