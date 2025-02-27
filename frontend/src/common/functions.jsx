import {useLocation, useParams} from "react-router";
import engJson from '../locales/en/en.json';
import frJson from '../locales/fr/fr.json';
import {landingPageFooter, availableLanguages} from './constants'

function getLangHref(currentLang, pathname)
{

    let newPathname = pathname.slice((1+currentLang.length)).replaceAll('//','/');

    if(newPathname.length > 0)
        newPathname='/'+newPathname;

    if(currentLang===availableLanguages.fr)
        return '/'+availableLanguages.en+newPathname;

    return '/'+availableLanguages.fr+newPathname;
}

export function getLanguage(){
    const {language} = useParams();
    const browserLanguage = navigator.languages[1];

    if(language===availableLanguages.fr || language===availableLanguages.en)
        return language;
    else if(browserLanguage===availableLanguages.fr || language===availableLanguages.en)
        return browserLanguage;

    return availableLanguages.en;

}


export function getLangValues(){

    const {pathname} = useLocation();
    const currentLang = getLanguage();
    const langHref =getLangHref(currentLang, pathname);

    return {langHref, currentLang};
}

export function getPageContent(language, pageName){

    if(language===availableLanguages.fr)
        return frJson[pageName];

    return engJson[pageName];
}

export function getFooter(language){

    if(language===availableLanguages.fr)
        return landingPageFooter.fr;

    return landingPageFooter.en;
}
