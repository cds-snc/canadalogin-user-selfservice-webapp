import {Routes, Route, Navigate} from 'react-router';
import {UserProvider} from "./components/Providers/UserContext";
import HomePage from "./views/Home/HomePage";
import PrivateRoute from "./components/Providers/PrivateRoute.jsx";
import Page from "./views/Page.js";
import {PAGES} from "./utils/constants.jsx";

function App() {
      return (
          <UserProvider>
              <Routes>
                  <Route path="/" element={ <HomePage />} />
                  <Route path="/:language" element={ <HomePage />} />
                  <Route path="/:language/signup" element={<Page page={PAGES.signup}/>}/>
                  <Route path="/:language/:flow/verification/:type" element={<PrivateRoute route={PAGES.verification}><Page page={PAGES.verification}/></PrivateRoute>}/>
                  <Route path="/:language/:flow/password" element={ <PrivateRoute route={PAGES.password}><Page page={PAGES.password}/></PrivateRoute>} />
                  <Route path="/:language/:flow/verificationsetup" element={<PrivateRoute route={PAGES.verificationSetUp}><Page page={PAGES.verificationSetUp}/></PrivateRoute>}/>
                  <Route path="/:language/:flow/profile" element={<PrivateRoute route={PAGES.coreProfile}><Page page={PAGES.coreProfile}/></PrivateRoute>}/>
                  <Route path="/:language/redirecttorp" element={ <Page page="RP"/>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          </UserProvider>
      );
}
export default App;
