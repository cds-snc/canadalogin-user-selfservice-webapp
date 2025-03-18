import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import PasswordCreation from "../../components/SignUp/Password/PasswordCreation";
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import SignUpPassword from "../../components/SignUp/Password/SignUpPassword";

export default function PasswordPage() {
    const {langHref, currentLang} = getLangValues();
 
    return (
        <div className="mainBody">
                <Header langHref={langHref} currentLang={currentLang}/>
                <GcdsContainer className="gcds-page">
                    <PasswordCreation currentLang={currentLang}/>
                    {/* <SignUpPassword currentLang={currentLang}/> */}
                </GcdsContainer>
                <Footer currentLang={currentLang}/>
        </div>
        );
}