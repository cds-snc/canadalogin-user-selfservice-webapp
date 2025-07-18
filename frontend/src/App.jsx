import { Routes, Route, Navigate } from 'react-router';
import PrivateRoute from "./components/Providers/PrivateRoute.jsx";
import Page from "./views/Page.js";
import { PAGES, NAVIGATION_LINKS } from "./utils/constants.jsx";

function App() {
    const editLanguagePreferences = `/:language${NAVIGATION_LINKS.editLanguagePreferences}`
    const areYouSureEditYourLanguage = `/:language${NAVIGATION_LINKS.areYouSureEditYourLanguage}`
    const profileYouMayUpdateLanguage = `/:language${NAVIGATION_LINKS.profileYouMayUpdateLanguage}`

    return (
        <Routes>
            <Route element={<PrivateRoute />}>
                <Route path="/" element={<Page page={PAGES.manageDashboard} />} />
                <Route path="/:language" element={<Page page={PAGES.manageDashboard} />} />
                <Route path="/:language/" element={<Page page={PAGES.manageDashboard} />} />
                <Route path="/:language/profilenameedit" element={<Page page={PAGES.ProfileNameEdit} />} />
                <Route path="/:language/profilehome" element={<Page page={PAGES.ProfileHome} />} />
                <Route path="/:language/checkyouremail" element={<Page page={PAGES.CheckYourEmail} />} />
                <Route path="/:language/completetwostepverification" element={<Page page={PAGES.CompleteTwoStepVerification} />} />
                <Route path="/:language/firstverifyitsyou" element={<Page page={PAGES.FirstVerifyItsYou} />} />
                <Route path="/:language/enternewemail" element={<Page page={PAGES.EnterNewEmail} />} />
                <Route path="/:language/profileYouMayUpdateName" element={<Page page={PAGES.profileYouMayUpdateName} />} />
                <Route path="/:language/areYouSureUpdateContactNumber" element={ <Page page={PAGES.areYouSureUpdateContactNumber}/>} />
                <Route path="/:language/areYouSureEditYourName" element={<Page page={PAGES.areYouSureEditYourName} />} />
                <Route path="/:language/enterNewPhoneNumber" element={<Page page={PAGES.enterNewPhoneNumber} />} />
                <Route path="/:language/youMayUpdateEmailAtOtherPlaces" element={<Page page={PAGES.youMayUpdateEmailAtOtherPlaces} />} />
                <Route path="/:language/areYouSureUpdateYourEmail" element={<Page page={PAGES.areYouSureUpdateYourEmail} />} />
                <Route path="/:language/securitysettings" element={<Page page={PAGES.securitySettings} />} />
                <Route path={editLanguagePreferences} element={<Page page={PAGES.editLanguagePreferences} />} />
                <Route path={areYouSureEditYourLanguage} element={<Page page={PAGES.areYouSureEditYourLanguage} />} />
                <Route path={profileYouMayUpdateLanguage} element={<Page page={PAGES.profileYouMayUpdateLanguage} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}
export default App;