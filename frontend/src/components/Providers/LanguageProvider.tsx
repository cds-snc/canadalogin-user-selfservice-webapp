import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { LANGUAGE_DISPLAY_NAMES, AVAILABLE_LANGUAGES, PROFILE_LANGUAGES, CONTEXT_ACTIONS } from "../../utils/constants.jsx";
import { validateSelectedLanguage } from "../../utils/functions.jsx";



const initialState = {
    language: AVAILABLE_LANGUAGES.en,
};

interface Action {
    type: string
    payload: any
}

interface LanguageProviderProps {
    children: ReactNode;
    initial?: LanguageState;
    payload: any
}

interface LanguageState {
    language: string;
}

function languageReducer(state = initialState, action: Action) {
    switch (action.type) {
        case CONTEXT_ACTIONS.set_language:
            console.log("Setting language to:", action.payload);
            return { ...state, language: action.payload };
        default:
            return state;
    }
}

interface LanguageContextType {
    state: LanguageState;
    dispatch: Dispatch<Action>;
    setAppLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children, initial = initialState }: LanguageProviderProps) => {
    const [state, dispatch] = useReducer(languageReducer, initial);

    const setAppLanguage = (selectedLanguage) => {
        const languageToDisplay = validateSelectedLanguage(selectedLanguage);
        dispatch({ type: CONTEXT_ACTIONS.set_language, payload: languageToDisplay });
    };

    return (
        <LanguageContext.Provider value={{ state, setAppLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);

    if (!context)
        throw new Error("useLanguage should be used within a Provider");

    return context;
}