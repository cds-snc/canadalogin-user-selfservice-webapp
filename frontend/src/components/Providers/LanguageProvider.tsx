import { createContext, useContext, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";
import { CONTEXT_ACTIONS } from "../../utils/constants";

const initialState = {
  language: null,
};

interface LanguageProviderProps {
  children: ReactNode;
  initial?: LanguageState;
}

export interface LanguageState {
  language: string | null;
}

export type LanguageAction = {
  type: typeof CONTEXT_ACTIONS.set_language;
  payload: string | null;
};

function languageReducer(
  state: LanguageState = initialState,
  action: LanguageAction,
) {
  switch (action.type) {
    case CONTEXT_ACTIONS.set_language:
      return { ...state, language: action.payload };
    default:
      return state;
  }
}

interface LanguageContextType {
  state: LanguageState;
  dispatch: Dispatch<LanguageAction>;
  setAppLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({
  children,
  initial = initialState,
}: LanguageProviderProps) => {
  const [state, dispatch] = useReducer(languageReducer, initial);

  const setAppLanguage = (selectedLanguage: string) => {
    dispatch({ type: CONTEXT_ACTIONS.set_language, payload: selectedLanguage });
  };

  return (
    <LanguageContext.Provider value={{ state, dispatch, setAppLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage should be used within a Provider");
  }

  return context;
};
