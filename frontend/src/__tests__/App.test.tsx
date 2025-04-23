import App from '../App';
import {cleanup, render} from '@testing-library/react';
import {describe, test, afterEach, vi} from "vitest";
import '@testing-library/jest-dom';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, FLOW_TYPES} from "../utils/constants";
import {MemoryRouter} from "react-router";
import {buildTestSuite} from "./testSuite";
import {PAGES} from "../utils/constants.jsx";

describe('Routing Test', () => {

    const langHref = {attribute:'lang-href', en:'/'+AVAILABLE_LANGUAGES.en, fr:'/'+AVAILABLE_LANGUAGES.fr}

    test("Check home route with no language defined", () => {

        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.home, FLOW_TYPES.signUp,null, langHref.fr );
    });

    test("Check home route with en language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.en]}>
                <App />
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.home, FLOW_TYPES.signUp,null, langHref.fr );
    });

    test("Check home route with fr language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.fr]}>
                <App />
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.home, FLOW_TYPES.signUp,null, langHref.en );
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
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.password;
        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.password, FLOW_TYPES.signUp, null, langHref.fr + link);
    });

    test("Check password creation page route with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.password;
        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.password, FLOW_TYPES.signUp, null, langHref.en + link);
    });

    test("Check sign in password page route with en language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });
        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.password;
        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.password, FLOW_TYPES.signIn, null, langHref.fr + link);
    });
    test("Check sign in password page route with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });
        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.password;
        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.password, FLOW_TYPES.signIn, null, langHref.en + link);
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

    test("Check privacy page route with en language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.privacy]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.privacy , FLOW_TYPES.signUp, null, langHref.fr + NAVIGATION_LINKS.privacy);
    });

    test("Check privacy page route with fr language defined", () => {

        vi.mock("../components/Providers/PrivateRoute.jsx", () => {
            return {
                default: (props:any) => props.children,
            };
        });

        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.privacy]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.privacy, FLOW_TYPES.signUp, null, langHref.en + NAVIGATION_LINKS.privacy);
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


    afterEach(() => {
        cleanup();
    });
})