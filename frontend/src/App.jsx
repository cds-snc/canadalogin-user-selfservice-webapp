import {Routes, Route, Navigate} from 'react-router';
import HomePage from "./views/Home/HomePage";
import PasswordPage from "./views/Password/PasswordPage";
import SignUpPage from "./views/SignUp/SignUpPage";
import EmailVerification from "./views/SignUp/EmailVerificationPage";


function App() {
      return (
          <Routes>
              <Route path="/" element={ <HomePage />} />
              <Route path="/:language" element={ <HomePage />} />
              <Route path="/:language/signup" element={<SignUpPage/>}/>
              <Route path="/:language/signup/verifyemail/:email/" element={<EmailVerification />}/>
              <Route path="/:language/signup/password" element={ <PasswordPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      );
}
export default App;
