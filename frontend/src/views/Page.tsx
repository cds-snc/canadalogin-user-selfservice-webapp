import {getLangValues} from "../utils/functions";
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import {GcdsContainer, GcdsText} from "@cdssnc/gcds-components-react";
import Verification from "../components/Verification/Verification.jsx";
import Password from "../components/Password/Password.jsx";
import SignUpEmail from "../components/SignUp/SignUpEmail.jsx";
import Home from "../components/Home/Home.jsx";
import CreateCoreProfile from "../components/SignUp/Profile/CreateCoreProfile.jsx";
import Privacy from "../components/SignUp/Profile/Privacy.jsx";
import VerificationSetUp from "../components/SignUp/TwoStepVerification/VerificationSetUp"
import VerificationSelection from "../components/SignIn/VerificationSelection"
import {PAGES} from "../utils/constants";
import {useUser} from "../components/Providers/useUser";
import {useLocation, useParams} from "react-router";
import { trackPage } from "../utils/gatag.jsx";
import { useEffect } from "react";
import AreYouSureEditYourName from "../components/Manage/AreYouSureEditYourName.jsx";
import ProfileHome from "../components/Manage/ProfileHome.jsx";

function PageContents({page}:{page:string}) {
    switch(page) {
        case PAGES.home:
            return (
                <Home />
            );
        case PAGES.signup:
            return (
                <SignUpEmail />
            );
        case PAGES.password:
            return (
                <Password />
            );
        case PAGES.verification:
            return (
                <Verification />
            );
        case PAGES.verificationSetUp:
            return (
                <VerificationSetUp />
            );
        case PAGES.verificationSelection:
            return (
                <VerificationSelection/>
            );
        case PAGES.coreProfile:
            return (
                <CreateCoreProfile />
            );
        case PAGES.privacy:
            return (
                <Privacy />
            );
        case PAGES.ProfileHome:
            return (
                <ProfileHome />
            );
        case "RP":
            return (
                <GcdsText>
                    <strong>You are now logged into GC Sign in and have been redirected to Parks Canada Reservations</strong>
                </GcdsText>
            );
        case "Phone OTP":
            return (
                <GcdsText>
                    <iframe width="100%" height="166" scrolling="no" frameBorder="no" allow="autoplay"
                            src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/2097120054&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>
                    <div
                       style={{fontSize: "10px", color: "#cccccc",lineBreak: "anywhere",wordBreak: "normal",overflow: "hidden",whiteSpace: "nowrap",textOverflow: "ellipsis", fontFamily: "Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif",fontWeight: "100"}} >
                        <a href="https://soundcloud.com/gcsignin-554663209" title="GC Sign in" target="_blank"
                           style={{color: '#cccccc',  textDecoration: 'none'}}>GC Sign in</a> · <a
                        href="https://soundcloud.com/gcsignin-554663209/gc-sign-in-voice-code"
                        title="GC Sign in one time code" target="_blank" style={{color: '#cccccc',  textDecoration: 'none'}}>GC
                        Sign in one time code</a></div>
                </GcdsText>
            );
        case PAGES.areYouSureEditYourName:
            return (
                <AreYouSureEditYourName />
            ) 
        default:
            return (<div>Error</div>);
    }
}

export default function Page({page}: { page: string }) {
    const {pathname} = useLocation();
    const {language} = useParams();
    const {langHref, currentLang} = getLangValues(language, pathname);
    const {state} = useUser();

    useEffect(() => {
        trackPage(pathname, page)
    }, [pathname]);

    return (
        <div className="mainBody">
            <Header langHref={langHref} currentLang={currentLang} service={state.userData.service}/>
            <GcdsContainer className="gcds-page">
                <GcdsContainer size="sm" className="gcds-content">
                    <PageContents page={page}/>
                </GcdsContainer>
            </GcdsContainer>
            <Footer currentLang={currentLang}/>
        </div>
    );
}
