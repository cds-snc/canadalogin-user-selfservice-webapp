//comment to revert to demo
import {BrowserRouter as Router, Routes, Route, Navigate, useParams} from 'react-router';
import Header from './components/Header';
import Footer from './components/Footer';
import Default from './components/Default';
import React from "react";

/*
uncomment to revert to demo
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home.js';
import Login from './components/Login';
import Signup from './components/Signup';
import PasswordSignup from './components/PasswordSignup';
import PasskeySignup from './components/PasskeySignup';
import PasskeyLogin from './components/PasskeyLogin';
import MFASignup from './components/MFASignup';
import Dashboard from './components/Dashboard';
*/

function App() {
      return (
        <Router>
            <Routes>
                <Route path="/" element={ [<Header key='header'/>,<Default  key='page' />, <Footer key='footer' />]} />
                <Route path="/:language/" element={ [<Header key='header'/>,<Default  key='page' />, <Footer key='footer' />]} />
                <Route path="*" element={<Navigate to="/" replace />} />
                  {
                    /*
                    uncomment to revert to demo, remove {} as well
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signin" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/signup/password" element={<PasswordSignup />} />
                    <Route path="/signup/passkey" element={<PasskeySignup />} />
                    <Route path="/login/passkey" element={<PasskeyLogin />} />
                    <Route path="/signin/passkey" element={<PasskeyLogin />} />
                    <Route path="/signup/mfa" element={<MFASignup />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="*" element={<Navigate to="/" replace />} />

                     */
                  }
                </Routes>
            </Router>
      );
}



export default App;
