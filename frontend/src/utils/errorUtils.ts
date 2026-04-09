import i18n from "../i18n/index";

export const getErrorMessage = (
  language: string | undefined,
  errorCode: string | null | undefined,
): string => {
  if (!errorCode) {
    return "";
  }

  const lng = language === "fr" ? "fr" : "en";

  if (i18n.exists(`Error.${errorCode}`, { ns: "common", lng })) {
    return i18n.t(`Error.${errorCode}`, { ns: "common", lng });
  }

  return i18n.t("Error.serverError", { ns: "common", lng, defaultValue: "" });
};
