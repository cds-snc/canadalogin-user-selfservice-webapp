import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import EmailVerification from "../../components/SignUp/EmailVerification";
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import {useParams} from "react-router";

export default function EmailVerificationPage() {
    const {email} = useParams();
    const {langHref, currentLang} = getLangValues();

    return (
        <GcdsContainer mainContainer centered>
            <GcdsContainer className="gcds-main">
                <Header langHref={langHref} currentLang={currentLang}/>
                <GcdsContainer className="gcds-page">
                    <EmailVerification currentLang={currentLang} email={email}/>
                </GcdsContainer>
                <Footer currentLang={currentLang}/>
            </GcdsContainer>
        </GcdsContainer>
    );
}