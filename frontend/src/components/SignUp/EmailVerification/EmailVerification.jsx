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
import {getPageContent, isCodeValid} from "../../../utils/functions.jsx";
import {useUser} from "../../Providers/UserContext.jsx";
import {useNavigate} from "react-router";

const initialTime=10;

const submitForm = async () =>{
    //update logic for sending to server once we have the back end
    const response = {success:true, message:"Successfully submitted", error:null}
    return response;

}

export default function EmailVerification({currentLang}) {
    const {state, dispatch} = useUser();
    const [time, setTime] = useState(initialTime);
    const [timesRequested, setTimesRequested] = useState(2);
    const [errorJson, setError] = useState({heading: null, codeError:null});
    const navigate = useNavigate();
    const pageContentJson = getPageContent(currentLang, "EmailVerification");
    const errorPageJson = getPageContent(currentLang, "Error");

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formCode = formData.get('verificationCode')
        console.log(formCode);
        console.log("is valid", !isCodeValid(formCode));
        if(!isCodeValid(formCode)){
            setError({codeError: errorPageJson[3], heading: errorPageJson['1']});
            return;
        }

        const response = await submitForm(formData, currentLang);

        if (response.error)
            alert(response.error);
        else {
            const userData = {...state.userData, emailValidated:true};
            dispatch({type: 'SET_EMAIL', payload: userData});
            navigate("/" + currentLang + NAVIGATION_LINKS.password);
        }

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
                        {pageContentJson['2']} <strong>{state.userData.email}</strong>
                    </GcdsText>
                    <GcdsText>
                        {pageContentJson['3']}
                    </GcdsText>
                    <GcdsText>
                        {pageContentJson['4']}<strong>{pageContentJson['5']}</strong>
                    </GcdsText>
                    <form onSubmit={handleSubmit}>
                        <GcdsInput
                            inputId="verificationCode"
                            label={pageContentJson['6']}
                            name="verificationCode"
                            type="text"
                            validateOn="other"
                            errorMessage={errorJson.codeError}
                            required ></GcdsInput>
                       <SubmitButton currentLang={currentLang} />
                    </form>
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

