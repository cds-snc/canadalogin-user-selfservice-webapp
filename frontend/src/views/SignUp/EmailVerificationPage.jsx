import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import EmailVerification from "../../components/SignUp/EmailVerification/EmailVerification.jsx";
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import {useParams} from "react-router";
import {useUser} from "../../components/Providers/UserContext.jsx";

export default function EmailVerificationPage() {
    const {langHref, currentLang} = getLangValues();
    const {state} = useUser();

    return (
        <GcdsContainer mainContainer centered>
            <GcdsContainer className="gcds-main">
                <Header langHref={langHref} currentLang={currentLang} service={state.userData.service}/>
                <GcdsContainer className="gcds-page">
                    <EmailVerification currentLang={currentLang} />
                </GcdsContainer>
                <Footer currentLang={currentLang}/>
            </GcdsContainer>
        </GcdsContainer>
    );
}