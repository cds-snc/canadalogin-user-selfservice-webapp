import App from '../App';
import {cleanup, render, screen} from '@testing-library/react';
import {describe, expect} from "vitest";
import '@testing-library/jest-dom';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SERVICES} from "../utils/constants";
import {getFooter} from "../utils/functions";
import {MemoryRouter} from "react-router";
import engJson from '../locales/en/en.json';
import frJson from '../locales/fr/fr.json';

vi.mock(import("@cdssnc/gcds-components-react"), async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        GcdsButton: vi.fn((props)=><button aria-label={"gcds-"+props['type']} type={props['type']}>{props['children']}</button>),
        GcdsFieldset: vi.fn((props)=><legend aria-label={props['fieldset-id']} legend={props['legend']} hint={props['hint']}>{props['children']}</legend>),
        GcdsRadioGroup: vi.fn((props)=><input aria-label={props['name']} options={props['options']} name={props['name']} type="radio"></input>),
        GcdsInput: vi.fn((props)=><input aria-label={props['inputId']} label={props['label']} name={props['name']}></input>),
        GcdsDetails: vi.fn((props)=><gcds-details aria-label='gcds-details' details-title={props['detailsTitle']}>{props['children']}</gcds-details>),
        GcdsLink: vi.fn((props)=><gcds-link aria-label='gcds-link' href-value={props['href']}>{props['children']}</gcds-link>),
        GcdsFooter: vi.fn((props)=><gcds-footer aria-label='gcds-footer' display-value={props['display']} sub-links={props['subLinks']}/>),
        GcdsHeader: vi.fn((props)=><gcds-header aria-label='gcds-header' lang={props['lang']}  lang-href={props['langHref']}
                                                signature-variant={props['signature-variant']} skip-to-href={props['skipToHref']}/>)
    }
})
describe('Routing Test', () => {

    const langHref = {attribute:'lang-href', en:'/'+AVAILABLE_LANGUAGES.en, fr:'/'+AVAILABLE_LANGUAGES.fr}
    const lang =  {attribute:'lang', en:AVAILABLE_LANGUAGES.en, fr:AVAILABLE_LANGUAGES.fr};
    const subLinks =  {attribute:'sub-links', en:getFooter(AVAILABLE_LANGUAGES.en), fr:getFooter(AVAILABLE_LANGUAGES.fr)};

    test("Check home route with no language defined", () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(lang.en, engJson["Home"], engJson['Button'], engJson["FirstTimeGc"]);
    });

    test("Check home route with fr language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.fr]}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(lang.fr, frJson["Home"], frJson['Button'], frJson["FirstTimeGc"]);
    });

    test("Check home route with en language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.en]}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(lang.en, engJson["Home"], engJson['Button'], engJson["FirstTimeGc"]);
    });

    test("Check sign up route with en language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.en+NAVIGATION_LINKS.signUp]}>
                <App />
            </MemoryRouter>,
        )
        console.log(screen.debug());
        checkSignUpPageContents(lang.en, engJson["SignUpEmail"],langHref.fr+NAVIGATION_LINKS.signUp, engJson["EmailCollectionForm"], engJson['Button'], engJson["AlreadyGc"]);
    });

    test("Check sign up route with fr language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.fr+NAVIGATION_LINKS.signUp]}>
                <App />
            </MemoryRouter>,
        )
        checkSignUpPageContents(lang.fr, frJson["SignUpEmail"],langHref.en+NAVIGATION_LINKS.signUp, frJson["EmailCollectionForm"], frJson['Button'], frJson["AlreadyGc"]);
    });


    afterEach(() => {
        cleanup();
    });

    function checkHomePageContents(language, pageContentJson, buttonJson, alreadyGcJson) {

        expect(screen.queryByLabelText("gcds-header")).toHaveAttribute(langHref.attribute,langHref.language);
        expect(screen.queryByLabelText("gcds-header")).toHaveAttribute(lang.attribute,lang.language);

        Object.keys(pageContentJson).forEach(key => {
            if(key==='3')
                if(language===AVAILABLE_LANGUAGES.fr)
                    expect(screen.queryByText(pageContentJson['3'] + ' '+SERVICES[0].title)).toBeInTheDocument();
                else
                    expect(screen.queryByText(SERVICES[0].title+' '+ pageContentJson['3'])).toBeInTheDocument();
            else if (key==='4')
                expect(screen.queryByLabelText('gcds-details', {selector: 'gcds-details'})).toHaveAttribute('details-title', pageContentJson['4']);
            else if(key==='8')
                expect(screen.queryByLabelText('email', {selector: 'input'})).toHaveAttribute("label",pageContentJson['8']);
            else
                expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();
        });

        expect(screen.queryByText(buttonJson['submit'])).toBeInTheDocument();
        Object.keys(alreadyGcJson).forEach(key => expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument());

        expect(screen.queryByLabelText('gcds-link', {selector: 'gcds-link'})).toHaveAttribute('href-value', '/'+language+NAVIGATION_LINKS.signUp);
        expect(screen.queryByLabelText('gcds-footer', {selector: 'gcds-footer'})).toHaveAttribute(subLinks.attribute,subLinks.language);
    }

    function checkSignUpPageContents(language, pageContentJson, langLink, formContentJson, buttonJson, alreadyGcJson) {

        expect(screen.queryByLabelText("gcds-header")).toHaveAttribute(langHref.attribute, langLink);
        expect(screen.queryByLabelText("gcds-header")).toHaveAttribute(lang.attribute,lang.language);

        Object.keys(pageContentJson).forEach(key => {
            if(key==='3')
                if (language === AVAILABLE_LANGUAGES.fr)
                    expect(screen.queryByText(pageContentJson['3'] + ' ' + SERVICES[0].title)).toBeInTheDocument();
                else
                    expect(screen.queryByText(SERVICES[0].title + ' ' + pageContentJson['3'])).toBeInTheDocument();
            else
                expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();

        });

        Object.keys(formContentJson).forEach(key => {

            if(key==='1')
                expect(screen.queryByLabelText('email', {selector: 'input'})).toHaveAttribute("label",formContentJson['1']);
            else if(key==='2')
                expect(screen.queryByLabelText('gcds-email-fieldset')).toHaveAttribute("legend", formContentJson['2']);
            else if(key==='4')
                expect(screen.queryByLabelText('gcds-email-fieldset', {selector: 'legend'})).toHaveAttribute("hint", formContentJson['4']);
            else if(key==='6') {
                let options ='[{"label": "'+formContentJson['6']+'","id": "english", "value": "eng","checked":"true"},{"label": "'+formContentJson['7']+'","id": "french", "value": "fr"}]';
                if(language===lang.fr)
                    options ='[{"label": "'+formContentJson['6']+'","id": "english", "value": "eng"},{"label": "'+formContentJson['7']+'","id": "french", "value": "fr","checked":"true"}]';

                expect(screen.queryByLabelText('language', {selector: 'input'})).toHaveAttribute("type","radio");
                expect(screen.queryByLabelText('language', {selector: 'input'})).toHaveAttribute("options",options);
            }
        });

        expect(screen.queryByText(buttonJson['submit'])).toBeInTheDocument();
        Object.keys(alreadyGcJson).forEach(key => expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument());

        expect(screen.queryByLabelText('gcds-link', {selector: 'gcds-link'})).toHaveAttribute('href-value', langHref.language);
        expect(screen.queryByLabelText('gcds-footer', {selector: 'gcds-footer'})).toHaveAttribute(subLinks.attribute,subLinks.language);
    }
})
