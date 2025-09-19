import { useState } from "react";
import { getPageContent } from "../utils/functions";
import { PAGES } from "../utils/constants.jsx";

type ErrorMap = Record<string, string>;

export function useError(language: string) {
  const errorPageJson = getPageContent(language, PAGES.error);
  const [errors, setErrors] = useState<ErrorMap>({});

  const setError = (link: string, errorId: string) => {
    if (errorPageJson[errorId])
      setErrors((prev) => ({ ...prev, [link]: errorPageJson[errorId] }));
    else if (errorId) setErrors((prev) => ({ ...prev, [link]: errorId }));
    else setErrors((prev) => ({ ...prev, [link]: errorPageJson["7"] }));
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const getError = (index: string): { heading: any; errorMsg: string } => {
    return { heading: errorPageJson[1], errorMsg: errors[index] };
  };

  const hasErrors = (): boolean => {
    return errors !== null && Object.keys(errors).length > 0;
  };

  return {
    setError,
    clearAllErrors,
    getError,
    hasErrors,
  };
}
