import {Routes, Route, Navigate} from 'react-router';
import {UserProvider} from "./components/Providers/UserProvider";
import PrivateRoute from "./components/Providers/PrivateRoute.jsx";
import Page from "./views/Page.js";
import {PAGES} from "./utils/constants.jsx";

function App() {
      return (
          <UserProvider>
              <Routes>
                  <Route path="/" element={ <Page page={PAGES.home}/>} />
                  <Route path="/:language" element={ <Page page={PAGES.home}/>} />
                  <Route path="/:language/" element={ <Page page={PAGES.home}/>} />
                  <Route path="/:language/:flow/privacy" element={<Page page={PAGES.privacy}/>}/>
                  <Route path="/:language/:flow" element={<PrivateRoute route={PAGES.signup}><Page page={PAGES.signup}/></PrivateRoute>}/>
                  <Route path="/:language/:flow/verification/:type" element={<PrivateRoute route={PAGES.verification}><Page page={PAGES.verification}/></PrivateRoute>}/>
                  <Route path="/:language/:flow/password" element={ <PrivateRoute route={PAGES.password}><Page page={PAGES.password}/></PrivateRoute>} />
                  <Route path="/:language/:flow/verificationsetup" element={<PrivateRoute route={PAGES.verificationSetUp}><Page page={PAGES.verificationSetUp}/></PrivateRoute>}/>
                  <Route path="/:language/:flow/selectverification" element={<PrivateRoute route={PAGES.verificationSelection}><Page page={PAGES.verificationSelection}/></PrivateRoute>}/>
                  <Route path="/:language/:flow/profile" element={<PrivateRoute route={PAGES.coreProfile}><Page page={PAGES.coreProfile}/></PrivateRoute>}/>
                  <Route path="/:language/redirecttorp" element={ <Page page="RP"/>} />
                  <Route path="/:language/phoneotp" element={ <Page page="Phone OTP"/>} />
                  <Route path="/:language/areYouSureEditYourName" element={ <Page page={PAGES.areYouSureEditYourName} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                  <Route path="/:language/profilenameedit" element={ <Page page={PAGES.ProfileNameEdit}/>} />
                  <Route path="/:language/profilehome" element={ <Page page={PAGES.ProfileHome}/>} />
                  <Route path="/:language/checkyouremail" element={ <Page page={PAGES.CheckYourEmail}/>} />
                  <Route path="/:language/completetwostepverification" element={ <Page page={PAGES.CompleteTwoStepVerification}/>} />
                  <Route path="/:language/firstverifyitsyou" element={ <Page page={PAGES.FirstVerifyItsYou}/>} />
                  <Route path="/:language/profileYouMayUpdateName" element={ <Page page={PAGES.profileYouMayUpdateName}/>} />
                  <Route path="/:language/youMayUpdateEmailAtOtherPlaces" element={ <Page page={PAGES.youMayUpdateEmailAtOtherPlaces}/>} />

                  <Route path="/:language/areYouSureUpdateYourEmail" element={ <Page page={PAGES.areYouSureUpdateYourEmail}/>} />
              </Routes>
          </UserProvider>
      );
}
export default App;