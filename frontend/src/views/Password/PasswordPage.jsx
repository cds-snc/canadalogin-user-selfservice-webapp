import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import PasswordCreation from "../../components/Password/PasswordCreation";
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import {useUser} from "../../components/Providers/UserContext.jsx";

export default function PasswordPage() {
    const {langHref, currentLang} = getLangValues();
    const {state} = useUser();

    return (
        <div className="mainBody">
                <Header langHref={langHref} currentLang={currentLang} service={state.userData.service}/>
                <GcdsContainer className="gcds-page">
                    <PasswordCreation currentLang={currentLang}/>
                    {/* <SignUpPassword currentLang={currentLang}/> */}
                </GcdsContainer>
                <Footer currentLang={currentLang}/>
        </div>
        );
}