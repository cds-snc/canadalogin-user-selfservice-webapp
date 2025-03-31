import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import Verification from "../../components/SignUp/TwoStepVerification/Verification.jsx";

export default function VerificationPage() {
    const {langHref, currentLang} = getLangValues();

    return (
        <div className="mainBody">
            <Header langHref={langHref} currentLang={currentLang}/>
            <GcdsContainer className="gcds-page">
                <Verification currentLang={currentLang}/>
            </GcdsContainer>
            <Footer currentLang={currentLang}/>
        </div>
    );
}