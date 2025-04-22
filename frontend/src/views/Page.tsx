import {getLangValues} from "../utils/functions";
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import Verification from "../components/Verification/Verification.jsx";
import Password from "../components/Password/Password.jsx";
import SignUpEmail from "../components/SignUp/SignUpEmail.jsx";
import Home from "../components/Home/Home.jsx";
import CreateCoreProfile from "../components/SignUp/Profile/CreateCoreProfile.jsx";
import VerificationSetUp from "../components/SignUp/TwoStepVerification/VerificationSetUp"
import {PAGES} from "../utils/constants";
import {useUser} from "../components/Providers/UserContext";
import {useLocation, useParams} from "react-router";


function PageContents({page}:{page:string}) {

    switch(page) {
        case PAGES.home:
            return (
                <Home />
            );
        case PAGES.signup:
            return (
                <SignUpEmail />
            );
        case PAGES.password:
            return (
                <Password />
            );
        case PAGES.verification:
            return (
                <Verification />
            );
        case PAGES.verificationSetUp:
            return (
                <VerificationSetUp />
            );
        case PAGES.coreProfile:
            return (
                <CreateCoreProfile />
            );
        case "RP":
            return (<div>Redirect to RP</div>);
        default:
            return (<div>Error</div>);
    }
}

export default function Page({page}:{page:string}) {
    const {pathname} = useLocation();
    const {language} = useParams();
    const {langHref, currentLang} = getLangValues(language, pathname);
    const {state} = useUser();
    return (
        <div className="mainBody">
            <Header langHref={langHref} currentLang={currentLang} service={state.userData.service}/>
            <GcdsContainer className="gcds-page">
                <PageContents page={page} />
            </GcdsContainer>
            <Footer currentLang={currentLang}/>
        </div>
    );
}
