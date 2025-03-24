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
        GcdsStepper: vi.fn((props)=><gcds-stepper aria-label='gcds-stepper' current-step={props['currentStep']} tags={props['tag']}
                                                  total-steps={props['totalSteps']}>{props['children']}</gcds-stepper>),
        GcdsHeader: vi.fn((props)=><gcds-header aria-label='gcds-header' lang={props['lang']}  lang-href={props['langHref']}
                                                signature-variant={props['signature-variant']} skip-to-href={props['skipToHref']}/>)
    }
})
describe('Routing Test', () => {

    const langHref = {attribute:'lang-href', en:'/'+AVAILABLE_LANGUAGES.en, fr:'/'+AVAILABLE_LANGUAGES.fr}
    const subLinks =  {attribute:'sub-links', en:getFooter(AVAILABLE_LANGUAGES.en), fr:getFooter(AVAILABLE_LANGUAGES.fr)};

    test("Check home route with no language defined", () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(AVAILABLE_LANGUAGES.en, engJson["Home"], engJson['Button'], engJson["FirstTimeGc"]);
    });

    test("Check home route with fr language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.fr]}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(AVAILABLE_LANGUAGES.fr, frJson["Home"], frJson['Button'], frJson["FirstTimeGc"]);
    });

    test("Check home route with en language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.en]}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(AVAILABLE_LANGUAGES.en, engJson["Home"], engJson['Button'], engJson["FirstTimeGc"]);
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

    test("Check email verification page route with en language defined", async () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props) => props.children,
            };
        });

        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.verifyEmail]}>
                <App/>
            </MemoryRouter>,
        )
        checkEmailVerificationPageContents(AVAILABLE_LANGUAGES.en, engJson["EmailVerification"], langHref.fr + NAVIGATION_LINKS.verifyEmail, engJson['Button'], engJson["AlreadyGc"]);
    });

    test("Check email verification page route with fr language defined", async () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props) => props.children,
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

    function checkHomePageContents(language, pageContentJson, buttonJson, alreadyGcJson) {

        const header = screen.queryByLabelText("gcds-header");
        verifyHeader(header, langHref.language, language);

        Object.keys(pageContentJson).forEach(key => {
            if(key==='3')
                if(language===AVAILABLE_LANGUAGES.fr)
                    expect(screen.queryByText(pageContentJson['3'] + ' '+SERVICES[0].title)).toBeInTheDocument();
                else
                    expect(screen.queryByText(SERVICES[0].title+' '+ pageContentJson['3'])).toBeInTheDocument();
            else if (key==='4')
                expect(screen.queryByLabelText('gcds-details', {selector: 'gcds-details'})).toHaveAttribute('details-title', pageContentJson['4']);
            else if(key==='8')
            {
                expect(screen.queryByLabelText('email', {selector: 'input'})).toHaveAttribute("label",pageContentJson['8']);

            }
            else
                expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();
        });

        expect(screen.queryByText(buttonJson['submit'])).toBeInTheDocument();
        Object.keys(alreadyGcJson).forEach(key => expect(screen.queryByText(alreadyGcJson[key])).toBeInTheDocument());

        verifyFooterWithAlreadyLink(screen.queryByLabelText('gcds-link', {selector: 'gcds-link'}), '/'+language+NAVIGATION_LINKS.signUp, subLinks[language]);

    }

    function checkSignUpPageContents(language, pageContentJson, langLink, formContentJson, buttonJson, alreadyGcJson) {

        console.log(language)
        const header = screen.queryByLabelText("gcds-header");
        verifyHeader(header, langLink, language);

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
                if(language===AVAILABLE_LANGUAGES.fr)
                    options ='[{"label": "'+formContentJson['6']+'","id": "english", "value": "eng"},{"label": "'+formContentJson['7']+'","id": "french", "value": "fr","checked":"true"}]';

                expect(screen.queryByLabelText('language', {selector: 'input'})).toHaveAttribute("type","radio");
                expect(screen.queryByLabelText('language', {selector: 'input'})).toHaveAttribute("options",options);
            }
        });

        expect(screen.queryByText(buttonJson['submit'])).toBeInTheDocument();
        Object.keys(alreadyGcJson).forEach(key => expect(screen.queryByText(alreadyGcJson[key])).toBeInTheDocument());

        verifyFooterWithAlreadyLink(screen.queryByLabelText('gcds-link', {selector: 'gcds-link'}), langHref[language], subLinks[language]);
    }

    function checkEmailVerificationPageContents(language, pageContentJson, langLink, buttonJson, alreadyGcJson) {

        const header = screen.queryByLabelText("gcds-header");
        verifyHeader(header, langLink, language);

        const stepper =screen.queryByLabelText('gcds-stepper', {selector: 'gcds-stepper'});
        expect(stepper).toHaveAttribute('current-step', '1');
        expect(stepper).toHaveAttribute('tags', 'h1');
        expect(stepper).toHaveAttribute('total-steps', '5');

        Object.keys(pageContentJson).forEach(key => {
            if(key!=='6' && key!=='10' && key !=='11' && key!=='12')
                expect(screen.queryByText(pageContentJson[key])).toBeInTheDocument();
        });

        const links = screen.queryAllByLabelText('gcds-link', {selector: 'gcds-link'});
        expect(links[0]).toHaveAttribute('href-value', '/'+language+NAVIGATION_LINKS.signUp);
        verifyFooterWithAlreadyLink(links[1], langHref[language], subLinks[language]);
    }

    function verifyHeader(header, langLink, language)
    {
        expect(header).toHaveAttribute(langHref.attribute, langLink);
        expect(header).toHaveAttribute('lang',language);
    }

    function verifyFooterWithAlreadyLink(link, langLink, subLink)
    {
        expect(link).toHaveAttribute('href-value', langLink);
        expect(screen.queryByLabelText('gcds-footer', {selector: 'gcds-footer'})).toHaveAttribute(subLinks.attribute,subLink);
    }


})
