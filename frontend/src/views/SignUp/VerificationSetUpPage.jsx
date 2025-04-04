import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import VerificationSetUp from "../../components/SignUp/TwoStepVerification/VerificationSetUp.jsx";

export default function VerificationSetUpPage() {
    const {langHref, currentLang} = getLangValues();

    return (
        <div className="mainBody">
            <Header langHref={langHref} currentLang={currentLang}/>
            <GcdsContainer className="gcds-page">
                <VerificationSetUp currentLang={currentLang}/>
            </GcdsContainer>
            <Footer currentLang={currentLang}/>
        </div>
    );
}