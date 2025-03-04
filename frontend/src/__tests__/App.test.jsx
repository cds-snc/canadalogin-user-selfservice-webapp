import App from '../App';
import {cleanup, render, screen, queryByAttribute} from '@testing-library/react';
import {describe, expect} from "vitest";
import '@testing-library/jest-dom';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SERVICES} from "../utils/constants";
import {getFooter} from "../utils/functions";
import {MemoryRouter} from "react-router";
import React from "react";
import engJson from '../locales/en/en.json';
import frJson from '../locales/fr/fr.json';

describe('Routing Test', () => {

    const langHref = {attribute:'lang-href', en:'/'+AVAILABLE_LANGUAGES.en, fr:'/'+AVAILABLE_LANGUAGES.fr}
    const lang =  {attribute:'lang', en:AVAILABLE_LANGUAGES.en, fr:AVAILABLE_LANGUAGES.fr};
    const subLinks =  {attribute:'sub-links', en:getFooter(AVAILABLE_LANGUAGES.en), fr:getFooter(AVAILABLE_LANGUAGES.fr)};

    test("Check home route with no language defined", () => {
        const dom =render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(lang.en, engJson["Home"]);
    });

    test("Check home route with fr language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.fr]}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(lang.fr, frJson["Home"]);

    });

    test("Check home route with en language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.en]}>
                <App />
            </MemoryRouter>,
        )
        checkHomePageContents(lang.en, engJson["Home"]);
    });

    afterEach(() => {
        cleanup();
    });

    function checkHomePageContents(language, pageContentJson) {

        expect(screen.getByTestId("gcds-header")).toHaveAttribute(langHref.attribute,langHref.language);
        expect(screen.getByTestId("gcds-header")).toHaveAttribute(lang.attribute,lang.language);

        Object.keys(pageContentJson).forEach(key => {
            if(key==='3')
                if(language===AVAILABLE_LANGUAGES.fr)
                    expect(screen.getByText(pageContentJson['3'] + ' '+SERVICES[0].title)).toBeInTheDocument();
                else
                    expect(screen.getByText(SERVICES[0].title+' '+ pageContentJson['3'])).toBeInTheDocument();
            else if (key==='4')
                expect(screen.getByTestId("gcds-details")).toHaveAttribute('details-title', pageContentJson['4']);
            else if(key==='8')
                expect(screen.getByTestId("gcds-input")).toHaveAttribute("label",pageContentJson['8']);
            else
                expect(screen.getByText(pageContentJson[key])).toBeInTheDocument();
        });

        expect(screen.getByTestId("gcds-link")).toHaveAttribute('href', '/'+language+NAVIGATION_LINKS.signUp);
        expect(screen.getByTestId("gcds-footer")).toHaveAttribute(subLinks.attribute,subLinks.language);
    }
})
