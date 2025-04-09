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


export default function Home({currentLang}) {
    const pageContentJson = getPageContent(currentLang, "Home");
    console.log("Config URL", config.apiUrl);
    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                <GcdsHeading tag="h1">
                        {pageContentJson['1']}
                        <GcdsText marginTop="150" marginBottom="0">
                            {pageContentJson['2']}
                            <strong>
                                {currentLang===AVAILABLE_LANGUAGES.fr?' '+pageContentJson['3']+' ':''}
                                {` ${SERVICES[0].title}`}{currentLang===AVAILABLE_LANGUAGES.en?' '+pageContentJson['3']:''}
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
                            <SubmitButton currentLang={currentLang} />
                        </form>
                    </GcdsText>
                </GcdsContainer>
            <FirstTimeGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}

