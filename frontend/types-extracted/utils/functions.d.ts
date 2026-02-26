export function getLanguage(language: any): any;
export function getLangValues(language: any, pathname: any): {
    langHref: string;
    currentLang: any;
};
export function getPageContent(language: any, pageName: any): any;
export function getContentWithVariables(content: any, variables: any): any;
export function getFooter(language: any): string;
export function isEmailValid(email: any): any;
export function isCodeValid(code: any): any;
export function isPasswordValid(password: any): boolean;
export function isNameValid(name: any, minLength: any): any;
export function capitalizeFirstLetter(str: any): any;
export function formatTime(expirationTime: any, currentLang?: string): string;
export function convertLanguageToLanguageCode(updatedLanguage: any): string;
