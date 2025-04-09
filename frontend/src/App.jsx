import {Routes, Route, Navigate} from 'react-router';
import {UserProvider} from "./components/Providers/UserContext";
import HomePage from "./views/Home/HomePage";
import PasswordPage from "./views/Password/PasswordPage";
import SignUpPage from "./views/SignUp/SignUpPage";
import EmailVerification from "./views/SignUp/EmailVerificationPage";
import PrivateRoute from "./components/Providers/PrivateRoute.jsx";
import VerificationSetUpPage from "./views/SignUp/VerificationSetUpPage.jsx";
import CreateCoreProfilePage from "./views/SignUp/CreateCoreProfilePage.jsx";
import Page from "./views/Page.js";
import {PAGES} from "./utils/constants.jsx";

function App() {
      return (
          <UserProvider>
              <Routes>
                  <Route path="/" element={ <HomePage />} />
                  <Route path="/:language" element={ <HomePage />} />
                  <Route path="/:language/signup" element={<SignUpPage/>}/>
                  <Route path="/:language/signup/verifyemail/" element={<PrivateRoute route="signUpVerifyEmail"><EmailVerification /></PrivateRoute>}/>
                  <Route path="/:language/signup/password" element={ <PrivateRoute route="signUpPassword"><PasswordPage /></PrivateRoute>} />
                  <Route path="/:language/signup/verificationsetup" element={<PrivateRoute route="signUpVerification"><VerificationSetUpPage/></PrivateRoute>}/>
                  <Route path="/:language/:flow/verification/:type" element={<PrivateRoute route={PAGES.verification}><Page page={PAGES.verification}/></PrivateRoute>}/>
                  <Route path="/:language/signup/profile" element={<PrivateRoute route="signUpCoreProfile"><CreateCoreProfilePage/></PrivateRoute>}/>
                  <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          </UserProvider>
      );
}
export default App;
