import {getLangValues} from "../utils/functions";
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import Verification from "../components/Verification/Verification.jsx";
import SignUpEmail from "../components/SignUp/SignUpEmail.jsx";
import {PAGES} from "../utils/constants";
import {useUser} from "../components/Providers/UserContext";

function PageContents({page}:{page:string}) {

    switch(page) {
        case PAGES.signup:
            return (
                <SignUpEmail />
            );
        case PAGES.verification:
            return (
                <Verification />
            );
        case "RP":
            return (<div>Redirect to RP</div>);
        default:
            return (<div>Error</div>);
    }
}

export default function Page({page}:{page:string}) {
    const {langHref, currentLang} = getLangValues();
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
