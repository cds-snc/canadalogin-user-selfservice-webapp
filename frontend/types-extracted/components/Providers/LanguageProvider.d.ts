import { ReactNode, Dispatch } from "react";
interface Action {
    type: string;
    payload: any;
}
interface LanguageProviderProps {
    children: ReactNode;
    initial?: LanguageState;
}
interface LanguageState {
    language: string | null;
}
interface LanguageContextType {
    state: LanguageState;
    dispatch: Dispatch<Action>;
    setAppLanguage: (lang: string) => void;
}
export declare const LanguageProvider: ({ children, initial, }: LanguageProviderProps) => import("react/jsx-runtime").JSX.Element;
export declare const useLanguage: () => LanguageContextType;
export {};
