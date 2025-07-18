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
    const { userProfile, isLoading, editProfile } = state;
    console.log("language", language)


    const preferredLanguage = userProfile?.preferredLanguage?.toLowerCase();
    const editProfilePreferredLanguage = editProfile?.preferredLanguage?.toLowerCase();
    const languageDefault = preferredLanguage || editProfilePreferredLanguage || AVAILABLE_LANGUAGES.en;

    useEffect(() => {
        if (isLoading) return;

        const urlPath = pathname.split("/").filter(Boolean);
        const urlLanguage = urlPath[0]?.toLowerCase();
        const languageToDisplay = validateSelectedLanguage(urlLanguage || languageDefault);

        setAppLanguage(languageToDisplay);
        if (urlLanguage !== languageToDisplay) {
            if (urlPath.length > 1) {
                urlPath[0] = languageToDisplay;
                const newPath = urlPath.join("/");
                navigateHelper(newPath, true);

            } else {
                navigateHelper(languageToDisplay, true);

            }
        }

    }, [pathname, isLoading, languageDefault]);

    return null;
};
