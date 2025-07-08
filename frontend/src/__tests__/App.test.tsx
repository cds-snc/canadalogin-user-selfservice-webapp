import App from '../App';
import {cleanup, render, screen} from '@testing-library/react';
import {describe, test, afterEach, vi, beforeAll} from "vitest";
import '@testing-library/jest-dom';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, FLOW_TYPES} from "../utils/constants";
import {MemoryRouter} from "react-router";
import {buildTestSuite} from "./testSuite";
import {PAGES} from "../utils/constants.jsx";
import {useUser} from "../components/Providers/useUser";
import {TestDataUserProvider} from '../stories/Tests/utils/constants';

describe('Routing Tests', () => {

    vi.mock("../components/Providers/useUser.tsx", ()=>({
        useUser:vi.fn()
    }));
    const stateData = {...TestDataUserProvider};
    (useUser as jest.Mock).mockReturnValue({state:stateData});
    const mockedRoutesUserData ={
        signup: null,
        signin: null,
        manage: null
    }

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

    //-------------Sign Up Tests------------------------>
    test("Check sign up route with en language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.signUp};
        render(
            <MemoryRouter initialEntries={[langHref.en+NAVIGATION_LINKS.signUp]}>
                <App />
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.signup, FLOW_TYPES.signUp, null, langHref.fr+NAVIGATION_LINKS.signUp);
    });

    test("Check sign up route with fr language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.signUp};
        render(
            <MemoryRouter initialEntries={[langHref.fr+NAVIGATION_LINKS.signUp]}>
                <App />
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.signup, FLOW_TYPES.signUp, null, langHref.en+NAVIGATION_LINKS.signUp);
    });

    test("Check route with incorrect flow for sign up en", () => {

        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.signUp]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.home, FLOW_TYPES.signUp, null, langHref.fr);
    });
    test("Check route with incorrect flow for sign up fr", () => {

        render(
            <MemoryRouter initialEntries={[langHref.fr+NAVIGATION_LINKS.signUp]}>
                <App />
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.home, FLOW_TYPES.signUp,null, langHref.fr );
    });
    test("Check email verification page route with en language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.emailVerification};
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.email;
        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.email, langHref.fr+link);
    });

    test("Check email verification page route with fr language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.emailVerification};
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.email;
        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.verifyEmail]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.email, langHref.en+link);
    });

    test("Check password creation page route with en language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.passwordCreation};
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.password;
        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.password, FLOW_TYPES.signUp, null, langHref.fr + link);
    });

    test("Check password creation page route with fr language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.passwordCreation};
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.password;
        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.password, FLOW_TYPES.signUp, null, langHref.en + link);
    });

    test("Check verification set up page route with en language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.verificationSetUp};
        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.twoStepVerification]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verificationSetUp, FLOW_TYPES.signUp, null, langHref.fr+NAVIGATION_LINKS.twoStepVerification);
    });

    test("Check verification set up page route with fr language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.verificationSetUp};
        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.twoStepVerification]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verificationSetUp, FLOW_TYPES.signUp, null, langHref.en+NAVIGATION_LINKS.twoStepVerification);
    });

    test("Check sign up verification page route for sms with en language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.verification};
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.sms;
        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.sms, langHref.fr + link);
    });

    test("Check sign up verification page route for voice with en language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.verification};
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.voice;
        render(
            <MemoryRouter initialEntries={[langHref.en +link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.voice, langHref.fr + link);
    });

    test("Check sign up verification page route for sms with fr language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.verification};
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.sms;

        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.sms, langHref.en + link);
    });

    test("Check sign up verification page route for voice with fr language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.verification};
        const link = '/' +FLOW_TYPES.signUp+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.voice;

        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verification, FLOW_TYPES.signUp, FLOW_TYPES.voice, langHref.en + link);
    });

    test("Check core profile page route with en language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.coreProfile};
        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.coreProfile]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.coreProfile, FLOW_TYPES.signIn, null, langHref.fr + NAVIGATION_LINKS.coreProfile);
    });

    test("Check core profile page route with fr language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signup.coreProfile};
        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.coreProfile]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.coreProfile, FLOW_TYPES.signIn, null, langHref.en + NAVIGATION_LINKS.coreProfile);
    });

    test("Check privacy page route with en language defined", () => {

        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.privacy]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.privacy , FLOW_TYPES.signUp, null, langHref.fr + NAVIGATION_LINKS.privacy);
    });

    //-------------Sign In Tests------------------------>
    test("Check sign in verification page route for sms with en language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signin.logInValidation};
        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.sms;
        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verification, FLOW_TYPES.signIn, FLOW_TYPES.sms, langHref.fr + link);
    });

    test("Check sign in verification page route for voice with en language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signin.logInValidation};
        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.voice;
        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verification, FLOW_TYPES.signIn, FLOW_TYPES.voice, langHref.fr + link);
    });

    test("Check sign in verification page route for sms with fr language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signin.logInValidation};
        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.sms;
        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verification, FLOW_TYPES.signIn, FLOW_TYPES.sms, langHref.en + link);
    });

    test("Check sign in verification page route for voice with fr language defined", () => {

        stateData.userData = {...stateData.userData , ...mockedRoutesUserData.signin.logInValidation};
        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.verification+'/'+FLOW_TYPES.voice;
        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verification, FLOW_TYPES.signIn, FLOW_TYPES.voice, langHref.en + link);
    });

    test("Check sign in password page route with en language defined", () => {

        stateData.userData = {...stateData.userData , ... mockedRoutesUserData.signin.password};
        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.password;
        render(
            <MemoryRouter initialEntries={[langHref.en + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.password, FLOW_TYPES.signIn, null, langHref.fr + link);
    });

    test("Check sign in password page route with fr language defined", () => {

        stateData.userData = {...stateData.userData , ... mockedRoutesUserData.signin.password};
        const link = '/' +FLOW_TYPES.signIn+NAVIGATION_LINKS.password;
        render(
            <MemoryRouter initialEntries={[langHref.fr + link]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.password, FLOW_TYPES.signIn, null, langHref.en + link);
    });

    test("Check sign in verification selection page route with en language defined", () => {

        stateData.userData = {...stateData.userData , ... mockedRoutesUserData.signin.logInValidation};
        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.verificationSelection]}>
                <App/>
            </MemoryRouter>,
        )

        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.verificationSelection, FLOW_TYPES.signIn, null, langHref.fr + NAVIGATION_LINKS.verificationSelection);
    });

    test("Check sign in verification selection page route with fr language defined", () => {

        stateData.userData = {...stateData.userData , ... mockedRoutesUserData.signin.logInValidation};
        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.verificationSelection]}>
                <App/>
            </MemoryRouter>,
        )

        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.verificationSelection, FLOW_TYPES.signIn, null, langHref.en + NAVIGATION_LINKS.verificationSelection);
    });

    //-------------Manage Tests------------------------>

    test("Manage profile landing page with en language defined", () => {

        stateData.userData = {...stateData.userData , ... mockedRoutesUserData.manage};
        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.manage]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.manageDashboard, FLOW_TYPES.manage , null, langHref.fr + NAVIGATION_LINKS.manage);
    });

    test("Manage profile landing page with fr language defined", () => {

        stateData.userData = {...stateData.userData , ... mockedRoutesUserData.manage};
        render(
            <MemoryRouter initialEntries={[langHref.fr + NAVIGATION_LINKS.manage]}>
                <App/>
            </MemoryRouter>,
        )
        buildTestSuite.test(AVAILABLE_LANGUAGES.fr, PAGES.manageDashboard, FLOW_TYPES.manage , null, langHref.en + NAVIGATION_LINKS.manage);
    });

    test("Manage Security Settings page with en language defined", () => {

        stateData.userData = {...stateData.userData , ... mockedRoutesUserData.manage};
        render(
            <MemoryRouter initialEntries={[langHref.en + NAVIGATION_LINKS.securitySettings]}>
                <App/>
            </MemoryRouter>,
        )
        screen.debug()
        buildTestSuite.test(AVAILABLE_LANGUAGES.en, PAGES.securitySettings, FLOW_TYPES.manage , null, langHref.fr + NAVIGATION_LINKS.securitySettings);
    });

    beforeAll(()=>{
        mockedRoutesUserData.signup = getMockedSignUpData();
        mockedRoutesUserData.signin = getMockedSignInData();
        mockedRoutesUserData.manage = getMockedSignUpData()
    });

    beforeEach(()=>{
       stateData.userData = {...TestDataUserProvider.userData};
    });

    afterEach(() => {
        vi.clearAllMocks();
        cleanup();
    });
})

function getMockedSignUpData(){

    const signUp = { viewPrivacy: true};
    const emailVerification = {...signUp, email:'test@test.com'};
    const passwordCreation = {...emailVerification, emailValidated:true};
    const verificationSetUp = {...passwordCreation, passwordSubmitted: true, id: '5479'};
    const verification = {...verificationSetUp, phone: '+4161234567890', stepVerificationSent: true};
    const coreProfile = {...verification, stepVerified:true};

    return {signUp, emailVerification, passwordCreation, verificationSetUp, verification, coreProfile};
}
function getMockedSignInData(){


    const password = { email:'test@test.com'};
    const logInValidation ={...password, passwordValidated:true, phone: '+1(***) ***-1234', id:'12345-12346', otpType:'sms'}
    const dashboard = {...logInValidation}

    return {password, logInValidation, dashboard};
}