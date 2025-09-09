import { useEffect, useState } from 'react';
import {
    GcdsContainer,
    GcdsText,
    GcdsDetails,
    GcdsInput,
    GcdsStepper,
    GcdsLink, GcdsCheckboxes, GcdsGrid, GcdsButton
} from "@cdssnc/gcds-components-react";
import { getPageContent } from '../../../utils/functions.jsx';
import { authService } from "../../../services/authService.jsx";
import { passwordUpdate } from "../api/passwordUpdate.jsx";

import {
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
} from "../../../utils/constants.jsx";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { useParams } from "react-router";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";

export default function Password({ step, totalSteps, onNext, otpSentResponse, userOtpValue }) {
    const { state } = useUser();
    const { language } = useParams();
    const { submit, cancel } = getPageContent(language, "Button");
    const [passwordPolicy, setPasswordPolicy] = useState({ min: 12, max: 110 })
    const [serverErrorMessage, setServerErrorMessage] = useState("")
    const [checkedValue, setCheckedValue] = useState(false);
    const [password, setPassword] = useState("");


    const [passwordStrength, setPasswordStrength] = useState(0);
    const pageContentJson = getPageContent(language, PAGES.password);
    const errorPageJson = getPageContent(language, PAGES.error);
    const backToSecuritySettingsPage = `/${language}${NAVIGATION_LINKS.securitySettings}`;
    const navigateHelper = useNavigateHelper();
    console.log("passwordPolicy", passwordPolicy)

    useEffect(() => {
        async function loadMinMax() {
            try {
                const response = await authService.requestPasswordPolicy();
                if (response.success) {
                    const policy = { min: response.data.pwdMinLength, max: response.data.pwdMaxLength };
                    setPasswordPolicy(policy);
                }
            } catch (err) {
                console.log(err);
            }
        }

        loadMinMax();
    }, [])

    function handlePasswordChange(event) {
        setPasswordStrength(event.target.value.length);
        setPassword(event.target.value);
        setServerErrorMessage("");
    }


    const completePasswordUpdate = async () => {
        try {
            setServerErrorMessage("");
            const response = await passwordUpdate.finalStep(userOtpValue, otpSentResponse.trxId, password);
            if (response && response.success) {
                onNext(response.data);
            }
        } catch (err) {
            if (err && err.data && err.data.message) {
                setServerErrorMessage(err.data.message);
            }
            console.log('err', err)
        }
    };

    const optionsValues = [
        {
            "label": pageContentJson['11'],
            "id": "checkbox1",
            "value": "checkbox1",
            "checked": checkedValue
        }
    ];
    const errorMessage = errorPageJson[serverErrorMessage] || "";

    return (
        <GcdsContainer>

            <GcdsStepper
                currentStep={step}
                totalSteps={totalSteps}
                tag="h1"
                lang={language}>
                {pageContentJson['14']}
            </GcdsStepper>

            <>
                <GcdsText>
                    <span>{pageContentJson['4']}</span> <strong><span>{pageContentJson['5']}</span> {passwordPolicy.min} </strong> <span>{pageContentJson['6']}</span>
                </GcdsText>
                <GcdsDetails detailsTitle={pageContentJson['7']}>
                    <GcdsText>
                        {pageContentJson['8']}
                    </GcdsText>
                </GcdsDetails>
            </>

            <GcdsContainer>
                {state.testData !== undefined && (
                    <GcdsInput
                        inputId="input-password"
                        label={pageContentJson['9']}
                        name="password"
                        value={state.testData.password}
                        hint={pageContentJson['10']}
                        type="password"
                        onGcdsInput={handlePasswordChange}
                    // errorMessage={error.errorMsg}
                    ></GcdsInput>)
                }
                {state.testData === undefined && (<GcdsInput
                    inputId="input-password"
                    label={pageContentJson['9']}
                    name="password"
                    hint={pageContentJson['10']}
                    type={checkedValue ? "text" : "password"}
                    onGcdsInput={handlePasswordChange}
                    errorMessage={errorMessage}
                    minlength={passwordPolicy.min}
                    maxlength={passwordPolicy.max}
                    lang={language}
                    autofocus
                ></GcdsInput>)
                }
                <GcdsCheckboxes
                    checkboxId="checkbox-default"
                    legend={pageContentJson['11']}
                    name="checkbox"
                    options={optionsValues}
                    onGcdsChange={() => setCheckedValue(!checkedValue)}
                >
                </GcdsCheckboxes>

                <GcdsText>
                    <span>{pageContentJson['12']}</span> <strong>{passwordStrength}</strong> / {passwordPolicy.min} <span>{pageContentJson['13']}</span>
                </GcdsText>

                <GcdsGrid columns="repeat(auto-fit, minmax(100px, 100px))" gap="10px" align-items="center">
                    <GcdsButton disabled={password.length < passwordPolicy.min} style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
                        ev.preventDefault();
                        completePasswordUpdate()
                    }}>
                        {submit}
                    </GcdsButton>

                    <GcdsButton buttonRole="secondary" style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
                        ev.preventDefault();
                        navigateHelper(backToSecuritySettingsPage)
                    }}>
                        {cancel}
                    </GcdsButton>
                </GcdsGrid>
            </GcdsContainer>
        </GcdsContainer>
    )
}