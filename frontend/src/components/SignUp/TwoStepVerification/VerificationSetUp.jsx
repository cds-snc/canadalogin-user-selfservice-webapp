import {
    GcdsContainer, GcdsDetails, GcdsErrorSummary, GcdsFieldset, GcdsHeading, GcdsLink,
    GcdsRadioGroup,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {getPageContent} from '../../../utils/functions';
import {CONTEXT_ACTIONS, countryMapping, FLOW_TYPES, NAVIGATION_LINKS, PAGES} from "../../../utils/constants.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import {useState, useTransition} from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import {useUser} from "../../Providers/useUser.tsx";
import {authService} from "../../../services/authService.jsx";
import {useNavigate, useParams} from "react-router";

export default function VerificationSetUp() {
    const {state, dispatch} = useUser();
    const {language} = useParams();
    const [phone, setPhone] = useState('');
    const [countryCodeLength, setCountryCodeLength] = useState(0);
    const [errorJson, setError] = useState({heading: null, phoneError:null});
    const [isPending, startTransition] = useTransition();
    const navigate = useNavigate();
    const pageContentJson = getPageContent(language, PAGES.verificationSetUp);
    const errorPageJson = getPageContent(language, "Error");

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
                const response = await authService.transientOtpSend({
                    phoneNumber: '+'+formNumber,
                    otpType: formType,
                    userName: state.userData.email
                });
                console.log(response);
                if(response.success){
                    const userData = {...state.userData, phone:formData.get('phone'), stepVerificationSent: true, trxnId:response.data.trxnId};
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    console.log("success....", response);
                    navigate("/" + language +"/"+FLOW_TYPES.signUp +NAVIGATION_LINKS.verification+'/'+formType);
                }else {
                    console.log("Error....", response);
                    setError({phoneError: response.message, heading: errorPageJson['1']});
                }
            } catch (error) {

                console.error('Signup error:', error);
                setError({phoneError:  errorPageJson[7], heading: errorPageJson['1']});
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
                        data-testid="errorSummary"
                    />)
                }
                <GcdsContainer className="gcds-gap" >
                    <GcdsStepper currentStep="3" totalSteps="4"
                                 tag="h1"
                                 lang={language}>
                        {pageContentJson['1']}
                    </GcdsStepper>
                </GcdsContainer>
                <GcdsContainer>
                    <form id="form"  onSubmit={handleSubmit}>
                        <GcdsContainer>
                            <GcdsText>
                                {pageContentJson['2']}
                            </GcdsText>
                            <GcdsText>
                                <GcdsLink href={`/${language}${NAVIGATION_LINKS.signUp}`} >
                                    {pageContentJson['3']}
                                </GcdsLink>
                            </GcdsText>
                            <GcdsHeading tag="h2">
                                {pageContentJson['4']}
                            </GcdsHeading>
                            <GcdsText>
                                {pageContentJson['5']}
                            </GcdsText>
                            <GcdsText>
                                <span>{pageContentJson['6']}</span> <GcdsLink href={`/${language}${NAVIGATION_LINKS.signUp}`} >{pageContentJson['7']}</GcdsLink> {pageContentJson['8']}
                            </GcdsText>
                        </GcdsContainer>
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
                            localization={language==='fr'?countryMapping.frLocalization:countryMapping.localization}
                            value={state.testData!=null?state.testData.phone:phone}
                            className={'high-res'}
                            enableSearch={true}
                            countryCodeEditable={false}
                            disableSearchIcon={false}
                            defaultErrorMessage={"Phone number is required"}
                            onChange={phone =>  setPhone(phone)}
                            isValid={(inputNumber, country) => {
                                setCountryCodeLength(country.format.replace(/[^.]/g,'').length)
                                return errorJson.phoneError===null;
                            }}
                        />
                        <br />
                        </GcdsContainer>
                        <GcdsText>
                            <GcdsDetails detailsTitle={pageContentJson['11']}>
                                <GcdsText>
                                    <span>{pageContentJson['12']}</span>
                                </GcdsText>
                            </GcdsDetails>
                        </GcdsText>
                        <GcdsFieldset
                            fieldset-id="gcds-verification-fieldset"
                            legend={pageContentJson['14']}
                            hint={pageContentJson['15']}
                            lang={language}
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
                        <SubmitButton currentLang={language} disabled={isPending} />
                    </form>
                </GcdsContainer>
            </GcdsContainer>
        </GcdsContainer>
    )
}