import {screen} from '@testing-library/react';
import {expect} from "vitest";
import '@testing-library/jest-dom';
import {AVAILABLE_LANGUAGES, SERVICES, FLOW_TYPES} from "../utils/constants";
import {getFooter} from "../utils/functions";
// @ts-ignore
import * as engJson from  '../locales/en/en.json';
// @ts-ignore
import * as frJson from '../locales/fr/fr.json';

const subLinks =  {attribute:'sub-links', en:getFooter(AVAILABLE_LANGUAGES.en), fr:getFooter(AVAILABLE_LANGUAGES.fr)};
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

interface TestParameters {
    language:string,
    pageContentJson: JSON,
    langLink: string,
    buttonJson: JSON,
    alreadyGcJson:JSON,
    isVoice: boolean,
    stepper:Array<string>,
    textKeysToNotSearch: Array<string>
}

export const buildTestSuite = {
    verificationPage: (language: string, isVoice: boolean, link: string, flow:string) => {
        testSuite.verificationPage(testSuite.verificationParameters(language, isVoice, link, flow));
    }
}

const testSuite = {
    verificationParameters: (language:string, isVoice:boolean, link:string, flow:string) =>{

        let testParameters = {
            language:language,
            pageContentJson:engJson["Verification"],
            langLink: '/'+AVAILABLE_LANGUAGES.fr+link,
            buttonJson: engJson['Button'],
            alreadyGcJson: engJson["AlreadyGc"],
            isVoice: isVoice,
            stepper:['3', 'h1', '4', AVAILABLE_LANGUAGES.en],
            textKeysToNotSearch:  ['11', '12', '15', '16', '17', '18', '19','20', '21']
        }

        if(language===AVAILABLE_LANGUAGES.fr){
            testParameters = {
                ...testParameters,
                pageContentJson:frJson["Verification"],
                langLink: '/'+AVAILABLE_LANGUAGES.en+link,
                buttonJson: frJson['Button'],
                alreadyGcJson: frJson["AlreadyGc"],
                stepper:['3', 'h1', '4', AVAILABLE_LANGUAGES.fr],
            }
        }

        if(flow===FLOW_TYPES.signIn)
        {
            testParameters = {
                ...testParameters,
                textKeysToNotSearch: ['11', '12', '13', '15', '16', '17'],
                alreadyGcJson: null,
                stepper:null,
            }
        }

        return testParameters;
    },
    verificationPage:  ({language, pageContentJson, langLink,  buttonJson, alreadyGcJson, isVoice, stepper, textKeysToNotSearch}:TestParameters) => {

        verifyCommonElements(language, langLink, buttonJson, alreadyGcJson, stepper);

        const smsTextKeys = ['2', '4'];
        const voiceTextKeys = ['3', '5'];

        Object.keys(pageContentJson).forEach(key => {
            if(key=='9')
                verifyGcdsHtmlElement('gcds-input',  createMap('gcds-input', ["verificationCode", pageContentJson[key], 'verificationCode', 'text', 'other'] ));
            else if (!textKeysToNotSearch.includes(key)) {
                if (smsTextKeys.includes(key) && !isVoice)
                    expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();
                else if (voiceTextKeys.includes(key) && isVoice)
                    expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();
                else if(!smsTextKeys.includes(key) && !voiceTextKeys.includes(key))
                    if(key==='20')
                        if(language===AVAILABLE_LANGUAGES.fr)
                            expect(screen.queryByText(pageContentJson[key] + ' '+SERVICES[0].title)).toBeInTheDocument();
                        else
                            expect(screen.queryByText(SERVICES[0].title+' '+ pageContentJson[key])).toBeInTheDocument();
                    else
                        expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();
            }
        });
    }


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