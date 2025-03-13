import App from '../App';
import {cleanup, render, screen, queryByAttribute} from '@testing-library/react';
import {describe, expect} from "vitest";
import '@testing-library/jest-dom';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SERVICES} from "../utils/constants";
import {getFooter, getPageContent} from "../utils/functions";
import {MemoryRouter} from "react-router";
import React from "react";
import engJson from '../locales/en/en.json';
import frJson from '../locales/fr/fr.json'

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

        expect(screen.getByTestId("gcds-header")).toHaveAttribute(langHref.attribute,langHref.fr);
        expect(screen.getByTestId("gcds-header")).toHaveAttribute(lang.attribute,lang.en);

        Object.keys(homePageJsonEn).forEach(key => {
            if(key==='3')
                expect(screen.getByText('GEO.ca '+ homePageJsonEn['3'])).toBeInTheDocument();
            else if (key!=='4' && key!=='8')
                expect(screen.getByText(homePageJsonEn[key])).toBeInTheDocument();
        });

        // expect(screen.getByTestId("gcds-footer")).toHaveAttribute(subLinks.attribute,subLinks.en);

    });

    test("Check passwordPage route with no language defined", () => {
        render(
            <MemoryRouter initialEntries={['/password']}>
                <App />
            </MemoryRouter>,
        )

        expect(screen.getByTestId("gcds-header")).toHaveAttribute(langHref.attribute,langHref.fr);
        expect(screen.getByTestId("gcds-header")).toHaveAttribute(lang.attribute,lang.en);

        Object.keys(passwordPageJsonEn).forEach(key => {
            if(key==='3')
                expect(screen.getByText('Your email was successfully verified '+ passwordPageJsonEn['1'])).toBeInTheDocument();
            else if (key!=='1' && key!=='7' && key!=='11')
                expect(screen.getByText(passwordPageJsonEn[key])).toBeInTheDocument();
        });

        expect(screen.getByTestId("gcds-footer")).toHaveAttribute(subLinks.attribute,subLinks.en);

    });

    test("Check home route with fr language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.fr]}>
                <App />
            </MemoryRouter>,
        )

        expect(screen.getByTestId("gcds-header")).toHaveAttribute(langHref.attribute,langHref.en);
        expect(screen.getByTestId("gcds-header")).toHaveAttribute(lang.attribute,lang.fr);

        Object.keys(homePageJsonFr).forEach(key => {
            if(key==='3')
                expect(screen.getByText(homePageJsonFr['3'] + ' GEO.ca')).toBeInTheDocument();
            else if (key!=='4' && key!=='8')
                expect(screen.getByText(homePageJsonFr[key])).toBeInTheDocument();
        });

        expect(screen.getByTestId("gcds-footer")).toHaveAttribute(subLinks.attribute,subLinks.fr);
    });

    test("Check home route with en language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.en]}>
                <App />
            </MemoryRouter>,
        )
        console.log(screen.debug());
        expect(screen.getByTestId("gcds-header")).toHaveAttribute(langHref.attribute,langHref.fr);
        expect(screen.getByTestId("gcds-header")).toHaveAttribute(lang.attribute,lang.en);

        Object.keys(homePageJsonEn).forEach(key => {
            if(key==='3')
                expect(screen.getByText('GEO.ca '+ homePageJsonEn['3'])).toBeInTheDocument();
            else if (key!=='4' && key!=='8')
                expect(screen.getByText(homePageJsonEn[key])).toBeInTheDocument();
        });

        expect(screen.getByTestId("gcds-footer")).toHaveAttribute(subLinks.attribute,subLinks.en);
    });

    afterEach(() => {
        cleanup();
    });
})
