import { screen } from '@testing-library/react';
import { expect } from "vitest";
import '@testing-library/jest-dom';
import { AVAILABLE_LANGUAGES, FLOW_TYPES, SERVICES } from "../utils/constants";
import { getFooter } from "../utils/functions";
// @ts-ignore
import * as engJson from '../locales/en/en.json';
// @ts-ignore
import * as frJson from '../locales/fr/fr.json';
import { PAGES } from "../utils/constants.jsx";

const subLinks = { attribute: 'sub-links', en: getFooter(AVAILABLE_LANGUAGES.en), fr: getFooter(AVAILABLE_LANGUAGES.fr) };
const GCDS_TAG_ATTRIBUTES = {
    'gcds-input': {
        attributes: ['input-id', 'label', 'name', 'type', 'validate-on']
    },
    'gcds-input2': {
        attributes: ['input-id', 'label', 'name', 'type', 'hint']
    },
    'gcds-input3': {
        attributes: ['input-id', 'label', 'name', 'type']
    },
    'gcds-fieldset': {
        attributes: ["fieldset-id", "hint", "legend"]
    },
    'gcds-radio-group': {
        attributes: ["name", "options"]
    },
    'gcds-button': {
        attributes: ["type"]
    },
    'gcds-footer': {
        attributes: ["sub-links"]
    },
    'gcds-header': {
        attributes: ['lang', 'lang-href', 'signature-variant']
    },
    'gcds-details': {
        attributes: ['details-title']
    },
    'gcds-stepper': {
        attributes: ['current-step', 'tag', 'total-steps', 'lang']
    },
    'gcds-stepper2': {
        attributes: ['current-step', 'tag', 'total-steps', 'lang', 'margin-bottom', 'margin-top']
    },
    'gcds-notice': {
        name: 'gcds-notice',
        attributes: ['notice-title', 'notice-title-tag', 'type']
    },
    'gcds-checkbox': {
        name: 'gcds-checkbox',
        attributes: ['checkbox-id', 'label', 'name']
    }
}

interface TestParameters {
    language: string,
    pageContentJson: JSON,
    langLink: string,
    buttonJson: JSON,
    alreadyGcJson: JSON,
    isVoice: boolean,
    stepper: Array<string>,
    textKeysToNotSearch: Array<string>,
    smsTextKeys: Array<string>,
    voiceTextKeys: Array<string>,
    serviceKey: string
}

export const buildTestSuite = {
    test:(language: string, page:string, flow:string, type:string, link: string)=>{
        testSuite.page(page, flow, testSuite.parameters(language, page, flow, type, link));
    }
}

const pageSetup = {
    button: (language: string) => {
        return language !== AVAILABLE_LANGUAGES.fr ? engJson['Button'] : frJson['Button'];
    },
    alreadyGc: (page:string, language:string, flow:string) =>{
        switch(page) {
            case PAGES.home:
                return language !== AVAILABLE_LANGUAGES.fr ? engJson["FirstTimeGc"] : frJson["FirstTimeGc"];
            case PAGES.signup:
                return language !== AVAILABLE_LANGUAGES.fr ? engJson["AlreadyGc"] : frJson["AlreadyGc"];
            case PAGES.password:
                if(flow===FLOW_TYPES.signUp)
                    return language !== AVAILABLE_LANGUAGES.fr ? engJson["AlreadyGc"] : frJson["AlreadyGc"];
                else
                    return null;
            case PAGES.verification:
                if (flow === FLOW_TYPES.signUp)
                    return language !== AVAILABLE_LANGUAGES.fr ? engJson["AlreadyGc"] : frJson["AlreadyGc"];
                else
                    return null;
            case PAGES.privacy:
                return language !== AVAILABLE_LANGUAGES.fr ? engJson["AlreadyGc"] : frJson["AlreadyGc"];
            default:
                return null;
        }
    },
    stepper: (page: string, language: string, flow: string, type: string) => {
        switch (page) {
            case PAGES.signup:
                return ['1', 'h1', '4', language];
            case PAGES.password:
                if(flow===FLOW_TYPES.signUp)
                    return ['2', 'h1', '4', language];
                else
                    return null;
            case PAGES.verification:
                if (flow === FLOW_TYPES.signUp)
                    if (type === FLOW_TYPES.email)
                        return ['1', 'h1', '4', language];
                    else
                        return ['3', 'h1', '4', language];
                else
                    return null;
            case PAGES.verificationSetUp:
                return ['3', 'h1', '4', language];
            case PAGES.coreProfile:
                return ['4', 'h1', '4', language];
            default:
                return null;
        }
    },
    textKeysToNotSearch: (page: string, flow: string, type: string) => {
        switch (page) {
            case PAGES.signup:
                return ['4', '6'];
            case PAGES.password:
                if(flow===FLOW_TYPES.signUp)
                    return ['2','10', '14','15','16','17','18','19'];
                else
                    return ['1','2','3','4','5','6','7','8','9','10','11','12','13'];
            case PAGES.verification:
                if(flow===FLOW_TYPES.signUp)
                    if(type===FLOW_TYPES.email)
                        return ['1','2','3','4','5','8','11','12','13','15','16','17','18','19','20','21','26'];
                    else
                        return ['11', '12', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26'];
                else
                    return ['11', '12', '13', '15', '16', '17', '22', '23', '24', '25', '26'];
            case PAGES.verificationSetUp:
                return ['9', '13', '15', '17', '18', '19'];
            case PAGES.privacy:
                return ['11','25','27','42'];
            default:
                return [];
        }
    },

    smsTextKeys: (page: string) => {
        switch (page) {
            case PAGES.verification:
                return ['2', '4'];
            default:
                return [];
        }
    },
    voiceTextKeys: (page: string) => {
        switch (page) {
            case PAGES.verification:
                return ['3', '5'];
            default:
                return [];
        }
    },
    serviceKey: (page:string, flow:string) =>{
        switch(page){
            case PAGES.home:
                return '3';
            case PAGES.password:
                if(flow===FLOW_TYPES.signUp)
                    return null;
                else
                    return '16';
            case PAGES.verification:
                return '20';
            case PAGES.privacy:
                return '3';
            default:
                return null;
        }
    },
    gcdsMap:(language:string, page:string, pageContentJson:JSON, flow:string)=>{
        switch(page){
            case PAGES.home:
                return pageSetup.homePageGcdsMap(pageContentJson);
            case PAGES.signup:
                return pageSetup.signUpEmailGcdsMap(language, pageContentJson);
            case PAGES.password:
                return pageSetup.passwordGcdsMap(flow, pageContentJson);
            case PAGES.verification:
                return pageSetup.verificationGcdsMap(pageContentJson);
            case PAGES.verificationSetUp:
                return pageSetup.verificationSetUpGcdsMap(pageContentJson);
            case PAGES.coreProfile:
                return pageSetup.coreProfileSetUpGcdsMap(pageContentJson);
            case PAGES.privacy:
                return pageSetup.privacyGcdsMap(pageContentJson);
            default:
                return new Map();
        }
    },
    homePageGcdsMap: (pageContentJson:JSON)=>{

        const gcdsElementMap = new Map();
        gcdsElementMap.set('4', ['gcds-details', createMap('gcds-details', [pageContentJson['4']])])
        gcdsElementMap.set('8', ['gcds-input', createMap('gcds-input', ['email', pageContentJson[8], 'email', 'email', 'other'] )])

        return gcdsElementMap;
    },
    signUpEmailGcdsMap: (language:string, pageContentJson:JSON)=>{

        const gcdsElementMap = new Map();
        gcdsElementMap.set('2', ['gcds-input', createMap('gcds-input', ['email', pageContentJson['2'], 'email', 'email', 'other'])]);
        gcdsElementMap.set('3', ['gcds-fieldset', createMap('gcds-fieldset', ['gcds-email-fieldset', pageContentJson['4'], pageContentJson['3']])]);
        if (language === AVAILABLE_LANGUAGES.fr) {
            const options = '[{"label": "' + pageContentJson['5'] + '","id": "english", "value": "eng"},{"label": "' + pageContentJson['6'] + '","id": "french", "value": "fr","checked":"true"}]';
            gcdsElementMap.set('5', ['gcds-radio-group', createMap('gcds-radio-group', ['language', options])]);

        } else {
            const options = '[{"label": "' + pageContentJson['5'] + '","id": "english", "value": "eng","checked":"true"},{"label": "' + pageContentJson['6'] + '","id": "french", "value": "fr"}]';
            gcdsElementMap.set('5', ['gcds-radio-group', createMap('gcds-radio-group', ['language', options])]);
        }

        return gcdsElementMap;
    },
    passwordGcdsMap: (flow:string, pageContentJson:JSON)=>{

        const gcdsElementMap = new Map();
        gcdsElementMap.set('9', ['gcds-input', createMap('gcds-input2', ["input-password", pageContentJson['9'], 'password', "password", flow===FLOW_TYPES.signUp?pageContentJson['10']:''])]);

        if(flow===FLOW_TYPES.signUp) {
            gcdsElementMap.set('1', ['gcds-notice', createMap('gcds-notice', [pageContentJson['1'], 'h2', 'success'])]);
            gcdsElementMap.set('7', ['gcds-details', createMap('gcds-details', [pageContentJson['7']])]);
            gcdsElementMap.set('11', ['gcds-checkbox', createMap('gcds-checkbox', ['checkbox-default', pageContentJson['11'], 'checkbox'])]);
        }

        return gcdsElementMap;
    },
    verificationGcdsMap: (pageContentJson: JSON) => {

        const gcdsElementMap = new Map();
        gcdsElementMap.set('9', ['gcds-input', createMap('gcds-input', ["verificationCode", pageContentJson['9'], 'verificationCode', 'text', 'other'])]);

        return gcdsElementMap;
    },
    verificationSetUpGcdsMap: (pageContentJson: JSON) => {

        const gcdsElementMap = new Map();
        gcdsElementMap.set('11', ['gcds-details', createMap('gcds-details', [pageContentJson['11']])])
        gcdsElementMap.set('14', ['gcds-fieldset', createMap('gcds-fieldset', ['gcds-verification-fieldset', pageContentJson['15'], pageContentJson['14']])]);
        const options = '[{"label": "' + pageContentJson['16'] + '","id": "sms", "value": "sms","checked":"true","hint": "' + pageContentJson['17'] + '"},{"label": "' + pageContentJson['18'] + '","id": "voice", "value": "voice","hint": "' + pageContentJson['19'] + '"}]';
        gcdsElementMap.set('16', ['gcds-radio-group', createMap('gcds-radio-group', ['verificationType', options])]);

        return gcdsElementMap;
    },
    coreProfileSetUpGcdsMap: (pageContentJson: JSON) => {

        const gcdsElementMap = new Map();
        gcdsElementMap.set('1', ['gcds-notice', createMap('gcds-notice', [pageContentJson['1'], 'h2', 'success'])]);
        gcdsElementMap.set('7', ['gcds-input', createMap('gcds-input3', ["firstName", pageContentJson['7'], 'firstName', 'text'])]);
        gcdsElementMap.set('8', ['gcds-input', createMap('gcds-input', ["lastName", pageContentJson['8'], 'lastName', 'text', 'other'])]);

        return gcdsElementMap;
    },
    privacyGcdsMap: (pageContentJson: JSON) => {
        const gcdsElementMap = new Map();
        gcdsElementMap.set('23', ['gcds-details', createMap('gcds-details', [pageContentJson['23']])])
        return gcdsElementMap;
    }

}

const testSuite = {
    parameters: (language: string, page: string, flow: string, type: string, link: string) => {

        return {
            language: language,
            pageContentJson: language !== AVAILABLE_LANGUAGES.fr ? engJson[page] : frJson[page],
            langLink: link,
            buttonJson: pageSetup.button(language),
            alreadyGcJson: pageSetup.alreadyGc(page, language, flow),
            stepper: pageSetup.stepper(page, language, flow, type),
            textKeysToNotSearch: pageSetup.textKeysToNotSearch(page, flow, type),
            isVoice: type === FLOW_TYPES.voice,
            smsTextKeys: pageSetup.smsTextKeys(page),
            voiceTextKeys: pageSetup.voiceTextKeys(page),
            serviceKey: pageSetup.serviceKey(page, flow),
        };
    },
    page:(page:string, flow:string, {language, pageContentJson, langLink,  buttonJson, alreadyGcJson, stepper, textKeysToNotSearch, isVoice, smsTextKeys, voiceTextKeys, serviceKey}:TestParameters)=>{
        verifyCommonElements(language, langLink, buttonJson, alreadyGcJson, stepper);

        const gcdsElementMap = pageSetup.gcdsMap(language, page, pageContentJson, flow);

        Object.keys(pageContentJson).forEach(key => {
            console.log("key: " + key);
            console.log("value: " + pageContentJson[key]);

            if(gcdsElementMap.has(key))
                verifyGcdsHtmlElement(gcdsElementMap.get(key)[0], gcdsElementMap.get(key)[1]);
            else if (!textKeysToNotSearch.includes(key))
                if (key === serviceKey)
                    if (language === AVAILABLE_LANGUAGES.fr)
                        expect(screen.queryByText(pageContentJson[key] + ' ' + SERVICES[0].title)).toBeInTheDocument();
                    else
                        expect(screen.queryByText(SERVICES[0].title + ' ' + pageContentJson[key])).toBeInTheDocument();
                else if ((!smsTextKeys.includes(key) && !voiceTextKeys.includes(key))
                    || (smsTextKeys.includes(key) && !isVoice)
                    || (voiceTextKeys.includes(key) && isVoice))
                    expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();
        });
    }
}

function verifyGcdsHtmlElement(tag: string, attributes: Map<string, string>) {
    const allElements = document.querySelectorAll(tag);
    let element = document.querySelector(tag) as HTMLElement;

    if (allElements !== null && allElements.length > 1) {
        allElements.forEach((el: HTMLElement) => {
            attributes.forEach((value) => {
                if (el.getAttribute(GCDS_TAG_ATTRIBUTES[tag].attributes[0]) === value)
                    element = el;
            });
        })
    }
    expect(element).toBeTruthy();
    expect(element).toBeInTheDocument();

    attributes.forEach((value:string, attribute:string) => {
        expect(attribute).toBeTruthy();
        expect(element).toHaveAttribute(attribute, value);
    });
}

function createMap(type: string, values: Array<string>) {

    try {
        const map = new Map();
        const attributes = GCDS_TAG_ATTRIBUTES[type].attributes;
        attributes.forEach((attribute: string, key: string) => {
            map.set(attribute, values[key]);
        });
        return map;
    } catch (e) {
        console.error(e);
        return null;
    }
}

function verifyCommonElements(language: string, langLink: string, buttonJson: JSON, alreadyGcJson: JSON, stepper: Array<string>) {

    verifyGcdsHtmlElement('gcds-header', createMap('gcds-header', [language, langLink, 'colour']));

    if (stepper)
        verifyGcdsHtmlElement('gcds-stepper', createMap('gcds-stepper', stepper));

    if (buttonJson) {
        verifyGcdsHtmlElement('gcds-button', createMap('gcds-button', ['submit']));
        expect(screen.queryByText(buttonJson['submit'])).toBeInTheDocument();
    }

    if (alreadyGcJson)
        Object.keys(alreadyGcJson).forEach(key => expect(screen.queryByText(alreadyGcJson[key])).toBeInTheDocument());

    verifyGcdsHtmlElement('gcds-footer', createMap('gcds-footer', [subLinks[language]]));
}