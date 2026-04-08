import { useState } from "react";

import { useTranslation } from "react-i18next";
import type { ErrorEntry, ErrorMap, UseErrorReturn } from "../types/hooks";

export function useError(): UseErrorReturn {
  const { t } = useTranslation("common");
  const [errors, setErrors] = useState<ErrorMap>({});

  const setError = (link: string, errorId: string) => {
    const translated = t(`Error.${errorId}`, { defaultValue: "" });
    if (translated) {
      setErrors((prev) => ({ ...prev, [link]: translated }));
      return;
    }

    if (errorId) {
      setErrors((prev) => ({ ...prev, [link]: errorId }));
      return;
    }

    setErrors((prev) => ({ ...prev, [link]: t("Error.serverError") }));
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const getError = (index: string): ErrorEntry => {
    return {
      heading: t("Error.genericProblem", { defaultValue: "" }),
      errorMsg: errors[index],
    };
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
