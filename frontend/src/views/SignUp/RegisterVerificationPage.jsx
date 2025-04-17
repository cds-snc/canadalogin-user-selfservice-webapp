import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import RegisterVerification from "../../components/SignUp/TwoStepVerification/RegisterVerification.jsx";
import {useUser} from "../../components/Providers/UserContext.jsx";
import {useLocation, useParams} from "react-router";

export default function RegisterVerificationPage() {
    const {pathname} = useLocation();
    const {language} = useParams();
    const {langHref, currentLang} = getLangValues(language, pathname);
    const {state} = useUser();

    return (
        <div className="mainBody">
            <Header langHref={langHref} currentLang={currentLang} service={state.userData.service}/>
            <GcdsContainer className="gcds-page">
                <RegisterVerification currentLang={currentLang}/>
            </GcdsContainer>
            <Footer currentLang={currentLang}/>
        </div>
    );
}