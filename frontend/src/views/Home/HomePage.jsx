import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import Home from "../../components/Home/Home";
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import {useUser} from "../../components/Providers/UserContext.jsx";
import {useLocation, useParams} from "react-router";

export default function HomePage() {
    const {pathname} = useLocation();
    const {language} = useParams();
    const {langHref, currentLang} = getLangValues(language, pathname);
    const {state} = useUser();

    return (
        <div className="mainBody">

                <Header langHref={langHref} currentLang={currentLang} service={state.userData.service}/>
                <GcdsContainer className="gcds-page">
                    <Home currentLang={currentLang}/>
                </GcdsContainer>
                <Footer currentLang={currentLang}/>

        </div>
    );
}