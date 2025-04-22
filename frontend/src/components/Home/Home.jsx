import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
    GcdsDetails,
    GcdsInput
} from "@cdssnc/gcds-components-react";
import {AVAILABLE_LANGUAGES, SERVICES} from "../../utils/constants";
import {getPageContent} from '../../utils/functions';
import FirstTimeGc from "../Layout/FirstTimeGc";
import SubmitButton from "../Layout/SubmitButton.jsx";
import config from "../../config.jsx";
import {useParams} from "react-router";


export default function Home() {
    const {language} = useParams();
    const pageContentJson = getPageContent(language, "Home");
    console.log("Config URL", config.apiUrl);
    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                <GcdsHeading tag="h1">
                        {pageContentJson['1']}
                        <GcdsText marginTop="150" marginBottom="0">
                            {pageContentJson['2']}
                            <strong>
                                {language===AVAILABLE_LANGUAGES.fr?' '+pageContentJson['3']+' ':''}
                                {` ${SERVICES[0].title}`}{language!==AVAILABLE_LANGUAGES.fr?' '+pageContentJson['3']:''}
                            </strong>
                        </GcdsText>
                </GcdsHeading>
                <GcdsDetails detailsTitle={pageContentJson['4']}>
                    <GcdsText>
                        {pageContentJson['5']}
                    </GcdsText>
                    <GcdsText>
                        {pageContentJson['6']}
                    </GcdsText>
                    <GcdsText>
                            {pageContentJson['7']}
                    </GcdsText>
                </GcdsDetails>
            </GcdsContainer>
                <GcdsContainer>
                    <GcdsText marginTop="100" marginBottom="0">
                        <form>
                            <GcdsInput
                                inputId="email"
                                label={pageContentJson['8']}
                                type="email"
                                name="email"
                                validateOn="other"
                            ></GcdsInput>
                            <SubmitButton currentLang={language} />
                        </form>
                    </GcdsText>
                </GcdsContainer>
            <FirstTimeGc currentLang={language}/>
        </GcdsContainer>
    )
}

