import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import VerificationSetUp from "../../components/SignUp/TwoStepVerification/VerificationSetUp.jsx";
import {useUser} from "../../components/Providers/UserContext.jsx";

export default function VerificationSetUpPage() {
    const {langHref, currentLang} = getLangValues();
    const {state} = useUser();

    return (
        <div className="mainBody">
            <Header langHref={langHref} currentLang={currentLang} service={state.userData.service}/>
            <GcdsContainer className="gcds-page">
                <VerificationSetUp currentLang={currentLang}/>
            </GcdsContainer>
            <Footer currentLang={currentLang}/>
        </div>
    );
}