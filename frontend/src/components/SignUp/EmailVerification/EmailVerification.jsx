import {
    GcdsContainer,
    GcdsHeading,
    GcdsInput,
    GcdsLink,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import AlreadyGc from "../../Layout/AlreadyGc.jsx";
import {NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import {useEffect, useState} from "react";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import {getPageContent} from "../../../utils/functions.jsx";

const initialTime=10;

const submitForm = async () =>{

    //update logic for sending to server once we have the back end
}


export default function EmailVerification({currentLang, email}) {

    const [time, setTime] = useState(initialTime);
    const [timesRequested, setTimesRequested] = useState(2);
    const pageContentJson = getPageContent(currentLang, "EmailVerification");

    useEffect(()=>{
        if(time<=0)
            return;

        const timer = setTimeout(()=>{
            setTime((prevTime) => prevTime-1);
            },1000);

        return () => clearTimeout(timer);

    },[time]);


    const requestNewCode = async (e) =>{
        e.preventDefault();
        setTimesRequested(prevState => prevState+1);
        setTime(initialTime*timesRequested);
        //update logic for requesting new code once API is available
    }

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                <GcdsContainer className="gcds-gap" >
                    <GcdsStepper currentStep="1" totalSteps="5"
                                 tag="h1"  >
                        {pageContentJson['1']}
                    </GcdsStepper>
                </GcdsContainer>
                <GcdsContainer>
                    <GcdsText>
                        {pageContentJson['2']} <strong>{email}</strong>
                    </GcdsText>
                    <GcdsText>
                        {pageContentJson['3']}
                    </GcdsText>
                    <GcdsText>
                        {pageContentJson['4']}<strong>{pageContentJson['5']}</strong>
                    </GcdsText>
                    <GcdsInput
                        inputId="verificationCode"
                        label={pageContentJson['6']}
                        name="verificationCode"
                        type="text"
                        validateOn="other"
                        required ></GcdsInput>
                   <SubmitButton currentLang={currentLang} />
                </GcdsContainer>
                <GcdsHeading tag="h2">
                    {pageContentJson['7']}
                </GcdsHeading>
                <GcdsContainer>
                    <GcdsText marginTop="200">
                        <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
                            {pageContentJson['8']}
                        </GcdsLink>
                    </GcdsText>
                    <GcdsText>
                        {time>0?(<span>{pageContentJson['9']}<strong>{time} {pageContentJson['10']}</strong></span>)
                            :(<GcdsLink href="#" onClick={requestNewCode} >
                                {pageContentJson['11']}
                              </GcdsLink>)}
                    </GcdsText>
                </GcdsContainer>
            </GcdsContainer>
            <AlreadyGc currentLang={currentLang}/>
        </GcdsContainer>
    );
}

