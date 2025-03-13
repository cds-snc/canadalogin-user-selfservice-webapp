import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import SignUpEmail from "../../components/SignUp/SignUpEmail";
import {GcdsContainer} from "@cdssnc/gcds-components-react";

export default function SignUpPage() {
    const {langHref, currentLang} = getLangValues();

    return (
        <div className="mainBody">
                <Header langHref={langHref} currentLang={currentLang}/>
                <GcdsContainer className="gcds-page">
                    <SignUpEmail currentLang={currentLang}/>
                </GcdsContainer>
                <Footer currentLang={currentLang}/>
        </div>
    );
}