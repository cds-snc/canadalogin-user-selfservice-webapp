import {useLocation, useParams} from "react-router";
import engJson from '../locales/en/en.json';
import frJson from '../locales/fr/fr.json';
import {AVAILABLE_LANGUAGES, FOOTERS} from './constants';


function getLangHref(currentLang, pathname)
{
    let newPathname = pathname.slice((1+currentLang.length));

    if(newPathname.length > 0)
        newPathname='/'+newPathname;

    if(currentLang===AVAILABLE_LANGUAGES.fr)
        return '/'+AVAILABLE_LANGUAGES.en+newPathname.replaceAll('//','/');

    return '/'+AVAILABLE_LANGUAGES.fr+newPathname.replaceAll('//','/');
}

function getLanguage(){
    const {language} = useParams();
    const browserLanguage = navigator.languages[1];

    if(language===AVAILABLE_LANGUAGES.fr || language===AVAILABLE_LANGUAGES.en)
        return language;
    else if(browserLanguage===AVAILABLE_LANGUAGES.fr || language===AVAILABLE_LANGUAGES.en)
        return browserLanguage;

    return AVAILABLE_LANGUAGES.en;

}

export function getLangValues(){

    const {pathname} = useLocation();
    const currentLang = getLanguage();
    const langHref =getLangHref(currentLang, pathname);

    return {langHref, currentLang};
}

export function getPageContent(language, pageName){

    if(language===AVAILABLE_LANGUAGES.fr)
        return frJson[pageName];

    return engJson[pageName];
}

export function getFooter(language){

    if(language===AVAILABLE_LANGUAGES.fr)
        return FOOTERS.default.fr;

    return FOOTERS.default.en;
}

export function isEmailValid(email){

    const isValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return (email!=null && email.match(isValidEmail));
}

export function isCodeValid(code){

    const isValidCode = /^[0-9]{6}$/;

    return (code!=null && code.match(isValidCode));
}

export function isPasswordValid(password){

    const isPasswordValid = /^.{12,65}$/;

    return (password != null && password.length >=12 && password.length <=65);
}