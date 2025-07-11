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