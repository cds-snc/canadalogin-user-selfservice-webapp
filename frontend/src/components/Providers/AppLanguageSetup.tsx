import { useEffect } from "react";
import { useLocation } from "react-router";
import { useLanguage } from "./LanguageProvider.tsx";
import { useUser } from "./useUser.tsx";
import { LANGUAGE_DISPLAY_NAMES, AVAILABLE_LANGUAGES, PROFILE_LANGUAGES, CONTEXT_ACTIONS } from "../../utils/constants.jsx";
import { validateSelectedLanguage } from "../../utils/functions.jsx";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";



export const AppLanguageSetup = () => {
    const { pathname } = useLocation();
    const navigateHelper = useNavigateHelper();

    const { state: languageState, setAppLanguage } = useLanguage();
    const { language } = languageState;
    const { state } = useUser();
    const { userProfile, isLoading } = state;
    console.log("language", language)
    const urlLanguage = pathname.split("/")[1]?.toLowerCase();
    const preferredLanguage = userProfile?.preferredLanguage?.toLowerCase();
    const languageDefault = preferredLanguage || AVAILABLE_LANGUAGES.en;
    const languageToDisplay = validateSelectedLanguage(urlLanguage || languageDefault);

    useEffect(() => {
        if (isLoading) return;
        setAppLanguage(languageToDisplay);
        if (urlLanguage !== languageToDisplay) {
            navigateHelper(languageToDisplay, true);
        }

    }, [pathname, isLoading, preferredLanguage]);

    return null;
};
