import {Routes, Route, Navigate} from 'react-router';
import HomePage from "./views/Home/HomePage";
import PasswordPage from "./views/Password/PasswordPage";
import SignUpPage from "./views/SignUp/SignUpPage";
import EmailVerification from "./views/SignUp/EmailVerificationPage";
import {UserProvider} from "./components/Providers/UserContext";
import PrivateRoute from "./components/Providers/PrivateRoute.jsx";


function App() {
      return (
          <UserProvider>
              <Routes>
                  <Route path="/" element={ <HomePage />} />
                  <Route path="/:language" element={ <HomePage />} />
                  <Route path="/:language/signup" element={<SignUpPage/>}/>
                  <Route path="/:language/signup/verifyemail/" element={<PrivateRoute route="signUpVerifyEmail"><EmailVerification /></PrivateRoute>}/>
                  <Route path="/:language/signup/password" element={ <PrivateRoute route="signUpPassword"><PasswordPage /></PrivateRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          </UserProvider>
      );
}
export default App;
