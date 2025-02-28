import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import Home from "../../components/Home/Home";
import {GcdsContainer} from "@cdssnc/gcds-components-react";

export default function HomePage() {
    const {langHref, currentLang} = getLangValues();

    return (
        <GcdsContainer mainContainer border centered >
            <GcdsContainer border centered >
               <Header langHref={langHref} currentLang={currentLang} />
            </GcdsContainer>
            <GcdsContainer border centered  padding="150" size="md">
                  <Home currentLang={currentLang}/>
            </GcdsContainer>
            <GcdsContainer centered padding="150" >
               <Footer currentLang={currentLang} />
            </GcdsContainer>
        </GcdsContainer>
        );
}