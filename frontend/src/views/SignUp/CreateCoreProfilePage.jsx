import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import CreateCoreProfile from "../../components/SignUp/Profile/CreateCoreProfile.jsx";

export default function CreateCoreProfilePage() {
    const {langHref, currentLang} = getLangValues();

    return (
        <div className="mainBody">
            <Header langHref={langHref} currentLang={currentLang}/>
            <GcdsContainer className="gcds-page">
                <CreateCoreProfile currentLang={currentLang}/>
            </GcdsContainer>
            <Footer currentLang={currentLang}/>
        </div>
    );
}