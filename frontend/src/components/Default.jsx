import {GcdsContainer, GcdsHeading, GcdsButton, GcdsLink, GcdsText, GcdsDetails, GcdsInput} from "@cdssnc/gcds-components-react";
import {SERVICES} from "../common/constants";
import {useNavigate} from "react-router";
import {getLanguage, getPageContent} from '../common/functions'

export default function Default() {
    const currentLang = getLanguage();
    const navigate = useNavigate();
    const pageContentJson = getPageContent(currentLang, "Default");

    return (
        <GcdsContainer padding="100" mainContainer>
            <GcdsContainer centered>
                <GcdsHeading tag="h1">
                    {pageContentJson['1']}
                    <GcdsText marginTop="200" marginBottom="0"> {pageContentJson['2']}
                        <strong>{` ${SERVICES[0].title}`}  {pageContentJson['3']}</strong>
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

