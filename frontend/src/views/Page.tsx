import { useEffect } from "react";
import { useLocation, useParams } from "react-router";
import { useUser } from "../components/Providers/useUser";
import { useLanguage } from "../components/Providers/LanguageProvider.tsx";

import { getLangValues } from "../utils/functions";
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import { GcdsContainer, GcdsText } from "@cdssnc/gcds-components-react";
import Verification from "../components/Verification/Verification.jsx";
import ChangePasswordIndex from "../features/ChangePassword/components/ChangePasswordIndex.jsx";
import SignUpEmail from "../components/SignUp/SignUpEmail.jsx";
import CreateCoreProfile from "../components/SignUp/Profile/CreateCoreProfile.jsx";
import Privacy from "../components/SignUp/Profile/Privacy.jsx";
import VerificationSetUp from "../components/SignUp/TwoStepVerification/VerificationSetUp"
import VerificationSelection from "../components/SignIn/VerificationSelection"
import ManageDashboard from "../components/Manage/ManageDashboard.jsx";
import { PAGES } from "../utils/constants";
import { trackPage } from "../utils/gatag.jsx";
import AreYouSureEditYourName from "../components/Manage/AreYouSureEditYourName.jsx";
import ProfileNameEdit from "../components/PersonalInfo/ProfileNameEdit.jsx";
import ProfileHome from "../components/Manage/ProfileHome.jsx";
import CheckYourEmail from "../components/Manage/CheckYourEmail.jsx";
import CompleteTwoStepVerification from "../components/Manage/CompleteTwoStepVerification.jsx";
import FirstVerifyItsYou from "../components/Manage/FirstVerifyItsYou.jsx";
import EnterNewEmail from "../components/Manage/EnterNewEmail.jsx";
import ProfileYouMayUpdateName from "../components/Manage/ProfileYouMayUpdateName.jsx";
import AreYouSureUpdateContactNumber from "../components/Manage/AreYouSureUpdateContactNumber.jsx";
import EnterNewPhoneNumber from "../components/Manage/EnterNewPhoneNumber.jsx";
import YouMayUpdateEmailAtOtherPlaces from "../components/Manage/YouMayUpdateEmailAtOtherPlaces.jsx";
import AreYouSureUpdateYourEmail from "../components/Manage/AreYouSureUpdateYourEmail.jsx";
import SecuritySettings from "../components/Manage/SecuritySettings.jsx";
import EditLanguagePreferences from "../components/Manage/EditLanguagePreferences.jsx";
import AreYouSureEditYourLanguage from "../components/Manage/AreYouSureEditYourLanguage.jsx";
import ProfileYouMayUpdateLanguage from "../components/Manage/ProfileYouMayUpdateLanguage.jsx";

function PageContents({ page }: { page: string }) {
    switch (page) {
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
                <VerificationSelection />
            );
        case PAGES.coreProfile:
            return (
                <CreateCoreProfile />
            );
        case PAGES.privacy:
            return (
                <Privacy />
            );
        case PAGES.manageDashboard:
            return (
                <ManageDashboard />
            );

        case PAGES.ProfileNameEdit:
            return (
                <ProfileNameEdit />
            );
        case PAGES.ProfileHome:
            return (
                <ProfileHome />
            );
        case PAGES.CheckYourEmail:
            return (
                <CheckYourEmail />
            );
        case PAGES.CompleteTwoStepVerification:
            return (
                <CompleteTwoStepVerification />
            );
        case PAGES.FirstVerifyItsYou:
            return (
                <FirstVerifyItsYou />
            );
        case PAGES.EnterNewEmail:
            return (
                <EnterNewEmail />
            );
        case PAGES.profileYouMayUpdateName:
            return (
                <ProfileYouMayUpdateName />
            );
        case PAGES.enterNewPhoneNumber:
            return (
                <EnterNewPhoneNumber />
            );
        case PAGES.youMayUpdateEmailAtOtherPlaces:
            return (
                <YouMayUpdateEmailAtOtherPlaces />
            );

        case PAGES.areYouSureUpdateYourEmail:
            return (
                <AreYouSureUpdateYourEmail />
            );
        case PAGES.securitySettings:
            return (
                <SecuritySettings />
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
                        style={{ fontSize: "10px", color: "#cccccc", lineBreak: "anywhere", wordBreak: "normal", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontFamily: "Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif", fontWeight: "100" }} >
                        <a href="https://soundcloud.com/gcsignin-554663209" title="GC Sign in" target="_blank"
                            style={{ color: '#cccccc', textDecoration: 'none' }}>GC Sign in</a> · <a
                                href="https://soundcloud.com/gcsignin-554663209/gc-sign-in-voice-code"
                                title="GC Sign in one time code" target="_blank" style={{ color: '#cccccc', textDecoration: 'none' }}>GC
                            Sign in one time code</a></div>
                </GcdsText>
            );
        case PAGES.areYouSureEditYourName:
            return (
                <AreYouSureEditYourName />
            )
        case PAGES.areYouSureUpdateContactNumber:
            return (
                <AreYouSureUpdateContactNumber />
            )

        case PAGES.editLanguagePreferences:
            return (
                <EditLanguagePreferences />
            )
        case PAGES.areYouSureEditYourLanguage:
            return (
                <AreYouSureEditYourLanguage />
            )
        case PAGES.profileYouMayUpdateLanguage:
            return (
                <ProfileYouMayUpdateLanguage />
            )
        case PAGES.updatePassword:
            return (
                <ChangePasswordIndex />
            )
        default:
            return (<div>Error</div>);
    }
}

export default function Page({ page }: { page: string }) {
    const { pathname } = useLocation();
    const { state } = useUser();
    const { state: languageState } = useLanguage();
    const { language } = languageState;
    const { langHref } = getLangValues(language, pathname);


    useEffect(() => {
        trackPage(pathname, page)
    }, [pathname]);
    return (
        <div className="mainBody">
            <Header langHref={langHref} currentLang={language} service={state.userData.service} />
            <GcdsContainer className="gcds-page">
                <GcdsContainer size="lg" className="gcds-content">
                    <PageContents page={page} />
                </GcdsContainer>
            </GcdsContainer>
            <Footer currentLang={language} />
        </div>
    );
}