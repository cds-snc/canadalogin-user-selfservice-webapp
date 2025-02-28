import {GcdsContainer, GcdsHeading, GcdsButton, GcdsLink, GcdsText, GcdsDetails, GcdsInput} from "@cdssnc/gcds-components-react";
import {AVAILABLE_LANGUAGES, SERVICES} from "../../utils/constants";
import {useNavigate} from "react-router";
import {getPageContent} from '../../utils/functions'

export default function Home({currentLang}) {
    const navigate = useNavigate();
    const pageContentJson = getPageContent(currentLang, "Home");

    return (
        <GcdsContainer padding="100" >
            <GcdsContainer centered>
                <GcdsHeading tag="h1">
                    {pageContentJson['1']}
                    <GcdsText marginTop="200" marginBottom="0"> {pageContentJson['2']}
                        <strong>{` ${SERVICES[0].title}`}  {currentLang===AVAILABLE_LANGUAGES.en?pageContentJson['3']:''}</strong>
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
                        <strong>{pageContentJson['8']}</strong>
                        <GcdsInput></GcdsInput>
                        <GcdsButton type="submit" size="small">
                            {pageContentJson['9']}
                        </GcdsButton>
                    </form>
                </GcdsText>
            </GcdsContainer>
            <GcdsHeading tag="h2">
                {pageContentJson['10']}
                <GcdsText marginTop="200" marginBottom="0">
                    <GcdsLink onClick={() => navigate(`/${currentLang}/signup`)}>
                        {pageContentJson['11']}
                    </GcdsLink>
                </GcdsText>
            </GcdsHeading>
        </GcdsContainer>
    )
}

