import App from '../App';
import {cleanup, render, screen} from '@testing-library/react';
import {describe, expect, test, afterEach, vi} from "vitest";
import '@testing-library/jest-dom';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SERVICES, FLOW_TYPES} from "../utils/constants";
import {getFooter} from "../utils/functions";
import {MemoryRouter} from "react-router";
// @ts-ignore
import * as engJson from  '../locales/en/en.json';
// @ts-ignore
import * as frJson from '../locales/fr/fr.json';
import {buildTestSuite} from "./testSuite";
import {PAGES} from "../utils/constants.jsx";

const GCDS_TAG_ATTRIBUTES = {
    'gcds-input':{
        attributes: ['input-id', 'label', 'name', 'type', 'validate-on']
    },
    'gcds-input2':{
        attributes: ['input-id', 'label', 'name', 'type', 'hint']
    },
    'gcds-input3':{
        attributes: ['input-id', 'label', 'name', 'type']
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
        attributes: ['current-step', 'tag', 'total-steps', 'lang']
    },
    'gcds-stepper2':{
        attributes: ['current-step', 'tag', 'total-steps', 'lang', 'margin-bottom', 'margin-top']
    },
    'gcds-notice':{
        name:'gcds-notice',
        attributes: ['notice-title', 'notice-title-tag', 'type']
    },
    'gcds-checkbox':{
        name:'gcds-checkbox',
        attributes: ['checkbox-id', 'label', 'name']
    }
}

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
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.signup, FLOW_TYPES.signUp, null, langHref.fr+NAVIGATION_LINKS.signUp);
    });

    test("Check sign up route with fr language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.fr+NAVIGATION_LINKS.signUp]}>
                <App />
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.signup, FLOW_TYPES.signUp, null, langHref.en+NAVIGATION_LINKS.signUp);
    });

    test("Check email verification page route with en language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.email;
        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.email, langHref.fr+link);
    });

    test("Check email verification page route with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.email;
        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.verifyEmail]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.email, langHref.en+link);
    });

    test("Check password creation page route with en language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.password]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.password, FLOW_TYPES.signUp, null, langHref.fr + NAVIGATION_LINKS.password);
       // checkPasswordCreationPageContents(AVAILABLE_LANGUAGES.en, engJson["PasswordCreation"], langHref.fr + NAVIGATION_LINKS.password, engJson['Button'], engJson["AlreadyGc"]);
    });

    test("Check password creation page route with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.password]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.password, FLOW_TYPES.signUp, null, langHref.en + NAVIGATION_LINKS.password);
    });

    test("Check verification set up page route with en language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });
        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.twoStepVerification]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verificationSetUp, FLOW_TYPES.signUp, null, langHref.fr+NAVIGATION_LINKS.twoStepVerification);
    });

    test("Check verification set up page route with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.twoStepVerification]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verificationSetUp, FLOW_TYPES.signUp, null, langHref.en+NAVIGATION_LINKS.twoStepVerification);
    });

    test("Check sign up verification page route for sms with en language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.sms;
        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )

        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.sms, langHref.fr + link);
    });

    test("Check sign up verification page route for voice with en language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.voice;

        render(
            <MemoryRouter initialEntries={[langHref.en +link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.voice, langHref.fr + link);
    });

    test("Check sign up verification page route for sms with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.sms;

        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.sms, langHref.en + link);
    });

    test("Check sign up verification page route for voice with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.voice;

        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.voice, langHref.en + link);
    });

    test("Check sign in verification page route for sms with en language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.sms;

        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verification, FLOW_TYPES.signIn, FLOW_TYPES.sms, langHref.fr + link);
    });

    test("Check sign in verification page route for voice with en language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.voice;

        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verification, FLOW_TYPES.signIn, FLOW_TYPES.voice, langHref.fr + link);
    });

    test("Check sign in verification page route for sms with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.sms;

        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verification, FLOW_TYPES.signIn, FLOW_TYPES.sms, langHref.en + link);
    });

    test("Check sign in verification page route for voice with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.voice;

        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verification, FLOW_TYPES.signIn, FLOW_TYPES.voice, langHref.en + link);
    });

    test("Check core profile page route with en language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.coreProfile]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.coreProfile, FLOW_TYPES.signIn, null, langHref.fr + NAVIGATION_LINKS.coreProfile);
    });

    test("Check core profile page route with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.coreProfile]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.coreProfile, FLOW_TYPES.signIn, null, langHref.en + NAVIGATION_LINKS.coreProfile);
    });

    test("Check verification page route for voice with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.verification+'/voice']}>
                <App/>
            </MemoryRouter>,
        )
        checkVerificationPageContents(AVAILABLE_LANGUAGES.fr, frJson["Verification"], langHref.en + NAVIGATION_LINKS.verification+'/voice', frJson['Button'], frJson["AlreadyGc"], true);
    });

    afterEach(() => {
        cleanup();
    });

    function checkHomePageContents(language: string, pageContentJson: JSON, langLink: string, buttonJson: JSON, alreadyGcJson: JSON) {

        verifyCommonElements(language, langLink, buttonJson, alreadyGcJson, null);

        const gcdsElementMap = new Map();
        gcdsElementMap.set('4', ['gcds-details', createMap('gcds-details', [pageContentJson['4']])])
        gcdsElementMap.set('8', ['gcds-input', createMap('gcds-input', ['email', pageContentJson[8], 'email', 'email', 'other'] )])

        Object.keys(pageContentJson).forEach(key => {
            if(key==='3')
                if(language===AVAILABLE_LANGUAGES.fr)
                    expect(screen.queryByText(pageContentJson[key] + ' '+SERVICES[0].title)).toBeInTheDocument();
                else
                    expect(screen.queryByText(SERVICES[0].title+' '+ pageContentJson[key])).toBeInTheDocument();
            else if(gcdsElementMap.has(key))
                verifyGcdsHtmlElement(gcdsElementMap.get(key)[0], gcdsElementMap.get(key)[1]);
            else
                expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();
        });

    }

    function verifyGcdsHtmlElement(tag: string, attributes:Map<string,string>)
    {
        const allElements = document.querySelectorAll(tag);
        let element = document.querySelector(tag) as HTMLElement;

        if(allElements!==null && allElements.length > 1) {
            allElements.forEach((el: HTMLElement) => {
                attributes.forEach((value) => {
                    if (el.getAttribute(GCDS_TAG_ATTRIBUTES[tag].attributes[0]) === value)
                        element = el;
                });
            })
        }
        expect(element).toBeTruthy();
        expect(element).toBeInTheDocument();

        attributes.forEach((value, attribute) => {
            expect(attribute&&value).toBeTruthy();
            expect(element).toHaveAttribute(attribute, value);
        });
    }

    function createMap(type:string, values:Array<string>) {

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

    function verifyCommonElements(language: string, langLink: string,  buttonJson: JSON, alreadyGcJson: JSON, stepper:Array<string>){
        verifyGcdsHtmlElement('gcds-header',  createMap('gcds-header', [language, langLink, 'colour'] ));

        if(stepper)
            verifyGcdsHtmlElement('gcds-stepper', createMap('gcds-stepper', stepper));

        if(buttonJson){
            verifyGcdsHtmlElement('gcds-button', createMap('gcds-button', ['submit']));
            expect(screen.queryByText(buttonJson['submit'])).toBeInTheDocument();
        }

        if(alreadyGcJson)
            Object.keys(alreadyGcJson).forEach(key => expect(screen.queryByText(alreadyGcJson[key])).toBeInTheDocument());

        verifyGcdsHtmlElement('gcds-footer', createMap('gcds-footer', [subLinks[language]]));
    }
})