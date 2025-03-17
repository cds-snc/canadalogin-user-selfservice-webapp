import {GcdsContainer, GcdsHeading, GcdsButton, GcdsLink, GcdsText, GcdsDetails, GcdsInput, GcdsNotice, GcdsStepper, GcdsCheckbox, GcdsIcon} from "@cdssnc/gcds-components-react";
import {AVAILABLE_LANGUAGES, SERVICES, NAVIGATION_LINKS} from "../../utils/constants";
import {useNavigate} from "react-router";
import {getPageContent} from '../../utils/functions';
import { useState } from 'react';
import {useActionState} from 'react';
import {useUser} from "../Providers/UserContext.jsx";

export default function PasswordCreation({currentLang}) {
    const {state} = useUser();
    const navigate = useNavigate();
    const pageContentJson = getPageContent(currentLang, "PasswordCreation");
    console.log(state); //remove this later. just here for testing and debugging
    function Form(){
        const [formState, actions] = useActionState(
            {   password: "",
                visibility: false,
            },
            {
                setPassword: (state, value) => ({...state, password: value }),
                setVisibility: (state, value) => ({...state, visibility: value }),
            }
        );
        const handleSubmit = (event) => {
            event.preventDefault();
            console.log(formState);
            console.log(actions);
            console.log(actions.setVisibility(!actions.visibility));
        };
  };

    return (
        <GcdsContainer className="gcds-content" >
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
                    <gcds-text> 
                        {pageContentJson['4']}<strong>{pageContentJson['5']}</strong>{pageContentJson['6']}
                    </gcds-text>
                    <GcdsDetails detailsTitle={pageContentJson['7']} data-testid="gcds-title">
                    <GcdsText>
                        {pageContentJson['8']}
                    </GcdsText>
                    </GcdsDetails>

           
            <GcdsContainer>
                    <form onSubmit={Form.handleSubmit} >
                        <GcdsInput
                        inputId="input-password"
                        label={pageContentJson['9']}
                        name="example-default"
                        hint={pageContentJson['10']}
                        lang={currentLang}
                        >
                            {console.log(Form.password)}
                        </GcdsInput>
                        <GcdsCheckbox
                            checkboxId="checkbox-default"
                            label={pageContentJson['11']}
                            name="checkbox"
                            data-testid="gcds-checkbox"
                            >
                        </GcdsCheckbox>
                
                <GcdsText>
                    {pageContentJson['12']} <strong>0</strong> {pageContentJson['13']}
                </GcdsText>

                    <GcdsText>
                        {pageContentJson['14']} <strong>{pageContentJson['15']}</strong>
                    </GcdsText>     

                        <GcdsButton type="submit" size="small" 
                        onChange= {(e) => actions.setPassword(e.target.value)}>
                            {pageContentJson['16']}
                        </GcdsButton>
                    </form>

            </GcdsContainer>
            
            <GcdsHeading tag="h2">
                {pageContentJson['17']}
            <GcdsText marginTop="200" marginBottom="0">
            <GcdsLink href={`/${currentLang}`} data-testid="gcds-link">
                {pageContentJson['18']}
            </GcdsLink>
            </GcdsText>
        </GcdsHeading>

        </GcdsContainer>
    )
}

