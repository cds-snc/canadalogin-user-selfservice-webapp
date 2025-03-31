import App from '../App';
import {cleanup, render, screen} from '@testing-library/react';
import {describe, expect, test, afterEach, vi} from "vitest";
import '@testing-library/jest-dom';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SERVICES} from "../utils/constants";
import {getFooter} from "../utils/functions";
import {MemoryRouter} from "react-router";
// @ts-ignore
import * as engJson from  '../locales/en/en.json';
// @ts-ignore
import * as frJson from '../locales/fr/fr.json';




describe('Routing Test', () => {

    const langHref = {attribute:'lang-href', en:'/'+AVAILABLE_LANGUAGES.en, fr:'/'+AVAILABLE_LANGUAGES.fr}
    const subLinks =  {attribute:'sub-links', en:getFooter(AVAILABLE_LANGUAGES.en), fr:getFooter(AVAILABLE_LANGUAGES.fr)};

    test("Check home route with no language defined", () => {

        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(AVAILABLE_LANGUAGES.en, engJson["Home"], langHref.fr, engJson['Button'], engJson["FirstTimeGc"]);
    });

    test("Check home route with en language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.en]}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(AVAILABLE_LANGUAGES.en, engJson["Home"], langHref.fr, engJson['Button'], engJson["FirstTimeGc"]);
    });

    test("Check home route with fr language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.fr]}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(AVAILABLE_LANGUAGES.fr, frJson["Home"], langHref.en, frJson['Button'], frJson["FirstTimeGc"]);
    });

    test("Check sign up route with en language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.en+NAVIGATION_LINKS.signUp]}>
                <App />
            </MemoryRouter>,
        )

       checkSignUpPageContents(AVAILABLE_LANGUAGES.en, engJson["SignUpEmail"],langHref.fr+NAVIGATION_LINKS.signUp, engJson["EmailCollectionForm"], engJson['Button'], engJson["AlreadyGc"]);
    });

    test("Check sign up route with fr language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.fr+NAVIGATION_LINKS.signUp]}>
                <App />
            </MemoryRouter>,
        )
        checkSignUpPageContents(AVAILABLE_LANGUAGES.fr, frJson["SignUpEmail"],langHref.en+NAVIGATION_LINKS.signUp, frJson["EmailCollectionForm"], frJson['Button'], frJson["AlreadyGc"]);
    });

    test("Check email verification page route with en language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.verifyEmail]}>
                <App/>
            </MemoryRouter>,
        )
        checkEmailVerificationPageContents(AVAILABLE_LANGUAGES.en, engJson["EmailVerification"], langHref.fr + NAVIGATION_LINKS.verifyEmail, engJson['Button'], engJson["AlreadyGc"]);
    });

    test("Check email verification page route with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.verifyEmail]}>
                <App/>
            </MemoryRouter>,
        )
        checkEmailVerificationPageContents(AVAILABLE_LANGUAGES.fr, frJson["EmailVerification"], langHref.en + NAVIGATION_LINKS.verifyEmail, frJson['Button'], frJson["AlreadyGc"]);
    });

    afterEach(() => {
        cleanup();
    });

    function checkHomePageContents(language: string, pageContentJson: JSON, langLink: string, buttonJson: JSON, alreadyGcJson: JSON) {

        verifyGcdsHtmlElement('gcds-header',  createMap('gcds-header', [language, langLink, 'colour'] ));

        Object.keys(pageContentJson).forEach(key => {
            if(key==='3')
                if(language===AVAILABLE_LANGUAGES.fr)
                    expect(screen.queryByText(pageContentJson[key] + ' '+SERVICES[0].title)).toBeInTheDocument();
                else
                    expect(screen.queryByText(SERVICES[0].title+' '+ pageContentJson[key])).toBeInTheDocument();
            else if (key==='4')
                verifyGcdsHtmlElement('gcds-details', createMap('gcds-details', [pageContentJson[key]]));
            else if(key==='8')
                verifyGcdsHtmlElement('gcds-input', createMap('gcds-input', ['email', pageContentJson[key], 'email', 'email', 'other'] ));
            else
                expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();
        });

        verifyGcdsHtmlElement('gcds-button', createMap('gcds-button', ['submit']));
        expect(screen.queryByText(buttonJson['submit'])).toBeInTheDocument();

        Object.keys(alreadyGcJson).forEach(key => expect(screen.queryByText(alreadyGcJson[key])).toBeInTheDocument());

        verifyGcdsHtmlElement('gcds-footer', createMap('gcds-footer', [subLinks[language]]));
    }

    function checkSignUpPageContents(language:string, pageContentJson: JSON, langLink: string,  formContentJson: JSON, buttonJson: JSON, alreadyGcJson:JSON) {

        verifyGcdsHtmlElement('gcds-header',  createMap('gcds-header', [language, langLink, 'colour'] ));

        Object.keys(pageContentJson).forEach(key => {
            if(key==='3')
                if (language === AVAILABLE_LANGUAGES.fr)
                    expect(screen.queryByText(pageContentJson[key] + ' ' + SERVICES[0].title)).toBeInTheDocument();
                else
                    expect(screen.queryByText(SERVICES[0].title + ' ' + pageContentJson[key])).toBeInTheDocument();
            else
                expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();

        });

        Object.keys(formContentJson).forEach(key => {

            if(key==='1')
                verifyGcdsHtmlElement('gcds-input', createMap('gcds-input', ['email', formContentJson[key], 'email', 'email', 'other'] ));
            else if(key==='2')
                verifyGcdsHtmlElement('gcds-fieldset', createMap('gcds-fieldset', ['gcds-email-fieldset',formContentJson['4'],formContentJson['2']]));
            else if(key==='6') {
                let options ='[{"label": "'+formContentJson['6']+'","id": "english", "value": "eng","checked":"true"},{"label": "'+formContentJson['7']+'","id": "french", "value": "fr"}]';
                    if(language===AVAILABLE_LANGUAGES.fr)
                        options ='[{"label": "'+formContentJson['6']+'","id": "english", "value": "eng"},{"label": "'+formContentJson['7']+'","id": "french", "value": "fr","checked":"true"}]';

                verifyGcdsHtmlElement('gcds-radio-group', createMap('gcds-radio-group', ['language',options]));
            }
        });

        verifyGcdsHtmlElement('gcds-button', createMap('gcds-button', ['submit']));
        expect(screen.queryByText(buttonJson['submit'])).toBeInTheDocument();

        Object.keys(alreadyGcJson).forEach(key => expect(screen.queryByText(alreadyGcJson[key])).toBeInTheDocument());

        verifyGcdsHtmlElement('gcds-footer', createMap('gcds-footer', [subLinks[language]]));
    }

    function checkEmailVerificationPageContents(language, pageContentJson, langLink, buttonJson, alreadyGcJson) {

        verifyGcdsHtmlElement('gcds-header',  createMap('gcds-header', [language, langLink, 'colour'] ));

        verifyGcdsHtmlElement('gcds-stepper', createMap('gcds-stepper', ['1', 'h1', '5'] ));

        Object.keys(pageContentJson).forEach(key => {
            if(key==='6')
                verifyGcdsHtmlElement('gcds-input', createMap('gcds-input', ['verificationCode', pageContentJson[key], 'verificationCode', 'text', 'other'] ));
            else if(key!=='10' && key !=='11' && key!=='12')
                expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();

        });

        verifyGcdsHtmlElement('gcds-button', createMap('gcds-button', ['submit']));
        expect(screen.queryByText(buttonJson['submit'])).toBeInTheDocument();

        Object.keys(alreadyGcJson).forEach(key => expect(screen.queryByText(alreadyGcJson[key])).toBeInTheDocument());
        verifyGcdsHtmlElement('gcds-footer', createMap('gcds-footer', [subLinks[language]]));
    }


    function verifyGcdsHtmlElement(tag: string, attributes:Map<string,string>)
    {
        const element = document.querySelector(tag) as HTMLElement;
        expect(element).toBeTruthy();
        expect(element).toBeInTheDocument();
        attributes.forEach((value, attribute) => {
            expect(attribute&&value).toBeTruthy();
            expect(element).toHaveAttribute(attribute, value);
        });
    }

    function createMap(type:string, values:Array<string>) {

        const GCDS_TAG_ATTRIBUTES = {
            'gcds-input':{
                attributes: ['input-id', 'label', 'name', 'type', 'validate-on']
            },
            'gcds-fieldset':{
                attributes: ["fieldset-id", "hint", "legend"]
            },
            'gcds-radio-group':{
                attributes:  ["name", "options"]
            },
            'gcds-button':{
                attributes: ["type"]
            },
            'gcds-footer':{
                attributes: ["sub-links"]
            },
            'gcds-header':{
                attributes: ['lang', 'lang-href', 'signature-variant']
            },
            'gcds-details':{
                attributes: ['details-title']
            },
            'gcds-stepper':{
                attributes: ['current-step', 'tag', 'total-steps']
            }
        }

        try{
            const map = new Map();
            const attributes = GCDS_TAG_ATTRIBUTES[type].attributes;
            attributes.forEach((attribute:string, key:string) => {
                map.set(attribute, values[key]);
            });
            return map;
        }catch(e){
            console.error(e);
            return null;
        }
    }


})