import {getLangValues} from "../utils/functions";
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import {GcdsContainer} from "@cdssnc/gcds-components-react";
import Verification from "../components/Verification/Verification.jsx"
import {PAGES} from "../utils/constants";

function PageContents({page}:{page:string}) {

    switch(page) {
        case PAGES.verification:
            return (
                <Verification />
            );
        default:
            return (<div>Error</div>);
    }
}

export default function Page({page}:{page:string}) {
    const {langHref, currentLang} = getLangValues();

    return (
        <div className="mainBody">
            <Header langHref={langHref} currentLang={currentLang}/>
            <GcdsContainer className="gcds-page">
                <PageContents page={page} />
            </GcdsContainer>
            <Footer currentLang={currentLang}/>
        </div>
    );
}
