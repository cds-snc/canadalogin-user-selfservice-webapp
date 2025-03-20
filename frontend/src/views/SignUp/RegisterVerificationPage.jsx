import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import RegisterVerification from "../../components/SignUp/TwoStepVerification/RegisterVerification.jsx";

export default function RegisterVerificationPage() {
    const {langHref, currentLang} = getLangValues();

    return (
        <div className="mainBody">
            <Header langHref={langHref} currentLang={currentLang}/>
            <GcdsContainer className="gcds-page">
                <RegisterVerification currentLang={currentLang}/>
            </GcdsContainer>
            <Footer currentLang={currentLang}/>
        </div>
    );
}