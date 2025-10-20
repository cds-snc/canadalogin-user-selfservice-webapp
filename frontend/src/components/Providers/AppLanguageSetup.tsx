import { useEffect } from "react";
import { useLocation } from "react-router";
import { useLanguage } from "./LanguageProvider.tsx";
import { useUser } from "./useUser.tsx";
import { AVAILABLE_LANGUAGES } from "../../utils/constants.jsx";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";

function validateSelectedLanguage(selectedLanguage: any) {
  if (!selectedLanguage) return undefined;
  const SUPPORTED_LANGUAGES = [AVAILABLE_LANGUAGES.en, AVAILABLE_LANGUAGES.fr];
  const languageValue = selectedLanguage.includes("-")
    ? selectedLanguage.split("-")[0].toLowerCase()
    : selectedLanguage.toLowerCase();
  const languageToDisplay = SUPPORTED_LANGUAGES.includes(languageValue)
    ? languageValue
    : AVAILABLE_LANGUAGES.en;
  return languageToDisplay;
}

export const AppLanguageSetup = () => {
  const { pathname } = useLocation();
  const { state } = useUser();
  const { state: languageState, setAppLanguage } = useLanguage();
  const { userProfile, isLoading } = state;
  const { language } = languageState;

  const navigateHelper = useNavigateHelper();

  const browserLanguage = navigator.language;

  useEffect(() => {
    if (isLoading) return;

    const urlPath = pathname.split("/").filter(Boolean);
    const urlLanguage = urlPath[0]?.toLowerCase();
    const normalizedUrlLanguage = validateSelectedLanguage(urlLanguage);

    const profilePreferredLanguage =
      userProfile?.preferredLanguage?.toLowerCase();

    const possibleLanguages =
      normalizedUrlLanguage ||
      language ||
      profilePreferredLanguage ||
      browserLanguage ||
      AVAILABLE_LANGUAGES.en;

    const languageToDisplay = validateSelectedLanguage(possibleLanguages);

    if (languageToDisplay !== language) {
      setAppLanguage(languageToDisplay);
    }

    if (languageToDisplay !== normalizedUrlLanguage) {
      if (urlPath.length > 1) {
        urlPath[0] = languageToDisplay;
        const newPath = urlPath.join("/");
        navigateHelper(newPath, true);
      } else {
        navigateHelper(languageToDisplay, true);
      }
    }
  }, [pathname, isLoading, userProfile?.preferredLanguage, language]);

  return null;
};
