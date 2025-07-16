import { useEffect } from "react";
import { useLocation } from "react-router";
import { useLanguage } from "./LanguageProvider.tsx";
import { useUser } from "./useUser.tsx";
import { LANGUAGE_DISPLAY_NAMES, AVAILABLE_LANGUAGES, PROFILE_LANGUAGES, CONTEXT_ACTIONS } from "../../utils/constants.jsx";



export const AppLanguageSetup = () => {
    const { pathname } = useLocation();
    const { state: languageState, setAppLanguage } = useLanguage();
    const { language } = languageState;
    const { state } = useUser();
    const { userProfile, isLoading } = state;

    useEffect(() => {
        if (isLoading) return;


        const urlLanguage = pathname.split("/")[1]?.toLowerCase();
        const profileLanguage = userProfile?.preferredLanguage?.toLowerCase();

        setAppLanguage(profileLanguage ?? AVAILABLE_LANGUAGES.en);

        if (urlLang !== preferred) {
            segments[1] = preferred; // update just the /:language part
            const newPath = segments.join("/");
            navigate(newPath, { replace: true });
        }

    }, [pathname, isLoading, userProfile]);

    return null;
};
