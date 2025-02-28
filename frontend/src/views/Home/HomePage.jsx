import {getLangValues} from "../../utils/functions";
import Header from '../../components/Layout/Header';
import Footer from '../../components/Layout/Footer';
import Home from "../../components/Home/Home";
import {GcdsContainer} from "@cdssnc/gcds-components-react";

export default function HomePage() {
    const {langHref, currentLang} = getLangValues();

    return (
        <GcdsContainer mainContainer centered>
            <div className="flex flex-col h-screen justify-between">
                <Header langHref={langHref} currentLang={currentLang}/>
                <div className="container mx-auto m-auto md:border-1 md:rounded-lg md:border-gray-500 pb-5 pr-5 pl-5 md:pb-5 md:pr-30 md:pl-30 md:pt-10 md:max-w-200 justify-center">
                    <Home currentLang={currentLang}/>
                </div>
                <Footer currentLang={currentLang}/>
            </div>
        </GcdsContainer>
);
}