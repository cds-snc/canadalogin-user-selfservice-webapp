import {Routes, Route, Navigate, useLocation} from 'react-router';
import {UserProvider} from "./components/Providers/UserProvider";
import PrivateRoute from "./components/Providers/PrivateRoute.jsx";
import Page from "./views/Page.js";
import {PAGES} from "./utils/constants.jsx";
import ReactGA from "react-ga4";
import { useEffect } from "react";

function App() {
    const location = useLocation();

    useEffect(() => {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }, [location]);

      return (
          <UserProvider>
              <Routes>
                  <Route path="/" element={ <Page page={PAGES.home}/>} />
                  <Route path="/:language" element={ <Page page={PAGES.home}/>} />
                  <Route path="/:language/" element={ <Page page={PAGES.home}/>} />
                  <Route path="/:language/:flow/privacy" element={<Page page={PAGES.privacy}/>}/>
                  <Route path="/:language/:flow" element={<Page page={PAGES.signup}/>}/>
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