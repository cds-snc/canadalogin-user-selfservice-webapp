import {GcdsContainer, GcdsHeading, GcdsButton, GcdsLink, GcdsText, GcdsDetails, GcdsInput, GcdsNotice, GcdsStepper, GcdsCheckbox, GcdsErrorSummary} from "@cdssnc/gcds-components-react";
import {AVAILABLE_LANGUAGES, SERVICES, NAVIGATION_LINKS} from "../../utils/constants";
import {getPageContent, isPasswordValid} from '../../utils/functions';
import { useState } from 'react';

const submitForm = async () =>{
    //update logic for sending to server API mockup
}

export default function PasswordCreation({currentLang}) {


    const [checkedValue, setCheckedValue] = useState(true);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [strengthLevel, setStrengthLevel] = useState("None");
    const [password, setPassword] = useState("");
    const [visibility, setVisibility] = useState(false);
    const [errorJson, setError] = useState({heading: null, passwordError:null});
    const pageContentJson = getPageContent(currentLang, "PasswordCreation");

    const errorPageJson = getPageContent(currentLang, "Error");

    async function handleSubmit (event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        setPassword(formData.get('password'));
        setVisibility(!visibility);
        if(!isPasswordValid(formData.get('password'))){
            setError({passwordError: errorPageJson[5], heading: errorPageJson['1']});
        return;
            }
            setError({passwordError:null, heading:null});
            await submitForm();
        };

  //Checkbox implementation (hide/show password)
    function validateCheckbox ()  {
        console.log(checkedValue);
        setCheckedValue (!checkedValue);
    }

    function handlePasswordChange (event) {
        const password = event.target.value;
        setPasswordStrength(password.length);
        updatePasswordStrength(password);
    };

 //Password length meter implementation 
    function updatePasswordStrength (password) {

        if (password.length >= 15) 
            setStrengthLevel("Very Strong");      
        else if (password.length >=12) 
            setStrengthLevel("Strong");       
        else if (password.length >=10)  
            setStrengthLevel("Medium");     
        else if (password.length >= 3)
            setStrengthLevel("Weak");
        else 
            setStrengthLevel("None");

        setPasswordStrength(password.length);
    };


    return (
        <GcdsContainer className="gcds-content" >
            {
            errorJson.passwordError!==null&&(<GcdsErrorSummary
                errorLinks={`{"#password": "${errorJson.passwordError}"}`}
                heading={errorJson.heading}
                />)
            }
            <GcdsContainer centered className="gcds-notice">
                <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['1']} data-testid="gcds-notice">
                    &nbsp;
                </GcdsNotice>
            </GcdsContainer>
                <GcdsText>
                    <GcdsStepper currentStep="2" totalSteps="5" tag="h1" lang={currentLang} marginTop="150" marginBottom="0">
                        {pageContentJson['3']}
                    </GcdsStepper>
                </GcdsText>
                    <GcdsText> 
                        {pageContentJson['4']}<strong>{pageContentJson['5']}</strong>{pageContentJson['6']}
                    </GcdsText>
                    <GcdsDetails detailsTitle={pageContentJson['7']} data-testid="gcds-title">
                    <GcdsText>
                        {pageContentJson['8']}
                    </GcdsText>
                    </GcdsDetails>
        <GcdsContainer>
            <form onSubmit={handleSubmit} >
                <GcdsInput
                    inputId="input-password"
                    label={pageContentJson['9']}
                    name="password"
                    hint={pageContentJson['10']}
                    lang={currentLang}
                    type={checkedValue? "password" : "text"}
                    className="form-control"
                    onGcdsInput={handlePasswordChange}
                    errorMessage={errorJson.passwordError}
                    required
                >
                </GcdsInput>
                    <small className="help-block" id="password-text"></small>
                        <GcdsCheckbox
                            checkboxId="checkbox-default"
                            label={pageContentJson['11']}
                            name="checkbox"
                            data-testid="gcds-checkbox"
                            onGcdsChange={validateCheckbox}
                            >
                                <GcdsText>
                                    {checkedValue? "false" : "true"}
                                </GcdsText>  
                        </GcdsCheckbox>


                    <GcdsContainer centered className="rectangle-container">
                      
                <GcdsText>
                    {pageContentJson['12']} <strong>{passwordStrength}</strong> {pageContentJson['13']}
                </GcdsText>
                    <div className="rectangle-container">
                        <span className="rectangle" style={{ backgroundColor: passwordStrength >= 3 ? (passwordStrength >= 10 ? (passwordStrength >= 12 ? (passwordStrength >= 15 ? 'green' : 'green') : 'yellow') : 'red') : (passwordStrength >= 1 ? 'red' : 'grey') }}></span>
                        <span className="rectangle" style={{ backgroundColor: passwordStrength >= 10 ? (passwordStrength >= 12 ? (passwordStrength >= 15 ? 'green' : 'green') : 'yellow') : 'grey' }}></span>
                        <span className="rectangle" style={{ backgroundColor: passwordStrength >= 12 ? (passwordStrength >= 15 ? 'green' : 'green') : 'grey' }}></span>
                        <span className="rectangle" style={{ backgroundColor: passwordStrength >= 15 ? 'green' : 'grey' }}></span>
                    </div>

                </GcdsContainer>

                {/* only warn on submit if character length is below 12 characters */}
                    <GcdsText>
                        {pageContentJson['14']} <strong>{strengthLevel}</strong>
                    </GcdsText>     
                        <GcdsButton type="submit" size="small">
                            {pageContentJson['16']}
                        </GcdsButton>
                    </form>
            </GcdsContainer>
            
            <GcdsHeading tag="h2">
                {pageContentJson['17']}
            <GcdsText marginTop="200" marginBottom="0">
            <GcdsLink href={`/${currentLang}`}>
                {pageContentJson['18']}
            </GcdsLink>
            </GcdsText>
        </GcdsHeading>

        </GcdsContainer>
    )
}



