import {
    GcdsContainer, GcdsDetails, GcdsErrorSummary, GcdsFieldset,
    GcdsLink, GcdsRadioGroup,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {getPageContent, isCodeValid} from '../../../utils/functions';
import {CONTEXT_ACTIONS, countryMapping, NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import {useState, useTransition} from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import VerificationSetUpInfo from "./VerificationSetUpInfo.jsx";
import {useUser} from "../../Providers/UserContext.jsx";
import {authService} from "../../../services/authService.jsx";
import {useNavigate} from "react-router";

export default function VerificationSetUp({currentLang}) {
    const {state, dispatch} = useUser();
    const [phone, setPhone] = useState('');
    const [countryCodeLength, setCountryCodeLength] = useState(0);
    const [errorJson, setError] = useState({heading: null, phoneError:null});
    const [isPending, startTransition] = useTransition();
    const navigate = useNavigate();
    const pageContentJson = getPageContent(currentLang, "VerificationSetUp");
    const errorPageJson = getPageContent(currentLang, "Error");

    function  handleSubmit (e){
        startTransition(async()=> {
            e.preventDefault();
            const formData = new FormData(e.target);
            const formNumber = await formData.get('phone').replace(/\D/g,'');
            const formType = formData.get('verificationType');




            if (phone.length < countryCodeLength) {
                if(phone.length===0)
                    setError({phoneError: errorPageJson[10], heading: errorPageJson['1']});
                else
                    setError({phoneError: errorPageJson[8]+countryCodeLength+errorPageJson[9], heading: errorPageJson['1']});

                return;
            }
            await setError({phoneError:null, heading:null});
            try {
                const response = await authService.sendTwoStepVerificationCode({
                    phoneNumber: formNumber,
                    verificationType: formType,
                    trxnId: 'f8e0a6bf-e74d-4df5-afeb-77ee601d45d0'//state.userData.trxnId
                });
                if(response.success){
                    const userData = {...state.userData, smsSent: true};
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    console.log("success....", response);
                   // navigate("/" + currentLang + NAVIGATION_LINKS.password);
                }else {
                    console.log("Error....", response);
                    setError({phoneError: errorPageJson[7], heading: errorPageJson['1']});
                }
            } catch (error) {
                console.error('Signup error:', error);
                setError({emailError:  errorPageJson[7], heading: errorPageJson['1']});
            }
        })
    }

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                {
                    errorJson.phoneError!==null&&(<GcdsErrorSummary
                        errorLinks={`{"#phone": "${errorJson.phoneError}"}`}
                        heading={errorJson.heading}
                    />)
                }
                <GcdsContainer className="gcds-gap" >
                    <GcdsStepper currentStep="3" totalSteps="5"
                                 tag="h1"
                                 lang={currentLang}>
                        {pageContentJson['1']}
                    </GcdsStepper>
                </GcdsContainer>
                <GcdsContainer>
                    <form onSubmit={handleSubmit}>
                        <VerificationSetUpInfo currentLang={currentLang} pageContentJson={pageContentJson} />
                        <GcdsContainer padding="200">
                        <PhoneInput
                            inputProps={{
                                name: 'phone',
                                required: true,
                                autoFocus: true,
                            }}
                            specialLabel={pageContentJson['10']}
                            country={'ca'}
                            onlyCountries={countryMapping.countries}
                            localization={currentLang==='fr'?countryMapping.frLocalization:countryMapping.localization}
                            value={phone}
                            className={'high-res'}
                            enableSearch={true}
                            countryCodeEditable={false}
                            disableSearchIcon={false}
                            defaultErrorMessage={"Phone number is required"}
                            onChange={phone =>  setPhone(phone)}
                            isValid={(inputNumber, country) => {
                                setCountryCodeLength(country.format.replace(/[^\.]/g,'').length)
                                return errorJson.phoneError===null;
                            }}
                        />
                        <br />
                        </GcdsContainer>
                        <GcdsText>
                            <GcdsDetails detailsTitle={pageContentJson['11']}>
                                <GcdsText>
                                    {pageContentJson['12']}&nbsp;
                                    <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
                                        {pageContentJson['13']}
                                    </GcdsLink>
                                </GcdsText>
                            </GcdsDetails>
                        </GcdsText>
                        <GcdsFieldset
                            fieldset-id="gcds-verification-fieldset"
                            legend={pageContentJson['14']}
                            hint={pageContentJson['15']}
                            required>
                            <br />
                            <GcdsRadioGroup
                                name="verificationType"
                                options={'['+
                                    `{"label": "${pageContentJson['16']}",`+
                                    `"id": "sms", "value": "sms","checked":"true",`+
                                    `"hint": "${pageContentJson['17']}"},`+
                                    `{"label": "${pageContentJson['18']}",`+
                                    `"id": "voice", "value": "voice",`+
                                    `"hint": "${pageContentJson['19']}"}]`}
                            />
                        </GcdsFieldset>
                        <SubmitButton currentLang={currentLang} disabled={isPending} />
                    </form>
                </GcdsContainer>
            </GcdsContainer>
        </GcdsContainer>
    )
}