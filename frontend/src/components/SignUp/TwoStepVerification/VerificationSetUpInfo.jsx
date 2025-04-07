import {GcdsContainer, GcdsHeading, GcdsLink, GcdsText} from "@cdssnc/gcds-components-react";
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS} from "../../../utils/constants.jsx";


export default function VerificationSetUpInfo({currentLang, pageContentJson}) {

    if(currentLang === AVAILABLE_LANGUAGES.fr)
        return (<GcdsContainer>
                    <GcdsText>
                        {pageContentJson['2']}
                    </GcdsText>
                    <GcdsText>
                        <span>{pageContentJson['3']}</span> <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >{pageContentJson['4']}</GcdsLink> {pageContentJson['5']}
                    </GcdsText>
            </GcdsContainer>
        )

    return (<GcdsContainer>
            <GcdsText>
                {pageContentJson['2']}
            </GcdsText>
            <GcdsText>
                <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
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
                <span>{pageContentJson['6']}</span> <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >{pageContentJson['7']}</GcdsLink> {pageContentJson['8']}
            </GcdsText>
        </GcdsContainer>
    )
}