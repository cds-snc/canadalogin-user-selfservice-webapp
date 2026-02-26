import { ReactNode } from "react";
export interface UserProfile {
    id: string;
    active: boolean;
    details?: null | {
        emailVerified: boolean | null;
        lastLogin: string | null;
        lastMFA: string | null;
        twoFactorAuthentication: boolean;
        pwdChangedTime: string | null;
    };
    emails?: null | Array<{
        value: string;
        type: string;
    }>;
    phoneNumbers?: null | Array<{
        value: string;
        type: string;
    }>;
    meta?: {
        created: string;
        location: string;
        lastModified: string;
        resourceType: string;
    };
    userName: string;
    preferredLanguage?: string;
    name?: {
        givenName?: string;
        familyName?: string;
        formatted?: string;
    } | null;
}
export interface RelyingPartyInfo {
    icon: string;
    id: string;
    linkName: string;
    url: string;
}
export interface UserState {
    userProfile: UserProfile | null;
    userData: any;
    isLoading: boolean;
    loadingText: string | null;
    relyingPartyInfo: RelyingPartyInfo | null;
    authenticatedPages: string[];
}
export interface SessionTimeoutState {
    showModal: boolean;
    isLoading: boolean;
    expirationTime: number | null;
    newServerSideExpirationTime: number | null;
}
interface UserProviderProps {
    children: ReactNode;
    initial?: UserState;
    initialSessionTimeoutState?: SessionTimeoutState;
}
export declare function UserProvider({ children, initial, initialSessionTimeoutState, }: UserProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
