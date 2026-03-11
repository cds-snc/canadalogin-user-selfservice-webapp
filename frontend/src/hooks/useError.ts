import { useState } from "react";

import { PAGES } from "../utils/constants";
import { getPageContent } from "../utils/functions";
import type { ErrorEntry, ErrorMap, UseErrorReturn } from "../types/hooks";

export function useError(language?: string): UseErrorReturn {
  const errorPageJson: Record<string, string> =
    getPageContent(language, PAGES.error) ?? {};
  const [errors, setErrors] = useState<ErrorMap>({});

  const setError = (link: string, errorId: string) => {
    if (errorPageJson[errorId]) {
      setErrors((prev) => ({ ...prev, [link]: errorPageJson[errorId] }));
      return;
    }

    if (errorId) {
      setErrors((prev) => ({ ...prev, [link]: errorId }));
      return;
    }

    setErrors((prev) => ({ ...prev, [link]: errorPageJson["7"] }));
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const getError = (index: string): ErrorEntry => {
    return { heading: errorPageJson["1"] ?? "", errorMsg: errors[index] };
  };

  const hasErrors = (): boolean => {
    return Object.keys(errors).length > 0;
  };

  return {
    setError,
    clearAllErrors,
    getError,
    hasErrors,
  };
}
