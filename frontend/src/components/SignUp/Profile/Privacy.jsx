import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
    GcdsLink,
    GcdsDetails
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import AlreadyGc from "../../Layout/AlreadyGc.jsx";
import { useParams } from "react-router";
import {AVAILABLE_LANGUAGES, PAGES, SERVICES} from "../../../utils/constants.jsx";
import {NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import {useSubmit} from "../../../hooks/useSubmit.js";


export default function Privacy() {
    const { language, flow } = useParams();
    const pageContentJson = getPageContent(language, PAGES.privacy);

    const submitDataOptions = {
        endpoint: null,
        navigateTo: "/" + language + NAVIGATION_LINKS.signUp,
        type: null,
        page: PAGES.privacy,
        flow: flow,
        onError: null
    };
    const {handleSubmit, isPending} = useSubmit(submitDataOptions, null );

    return (
        <GcdsContainer>
             <form  id="form"  onSubmit={handleSubmit}>
            <GcdsHeading tag='h1'>
                {pageContentJson['1']}
            </GcdsHeading>
             <GcdsText>
                 <span>{pageContentJson['2']}</span> <strong>{pageContentJson['46']}</strong> {pageContentJson['47']}
                 <strong>
                     {language===AVAILABLE_LANGUAGES.fr?' '+pageContentJson['3']+' ':<br/>}
                     {` ${SERVICES[0].title}`}{language!==AVAILABLE_LANGUAGES.fr?' '+pageContentJson['3']:''}
                 </strong>
             </GcdsText>
            <GcdsDetails detailsTitle={pageContentJson['42']}>
                <GcdsText>
                    {pageContentJson['43']}
                </GcdsText>
                <GcdsText>
                    {pageContentJson['44']}
                </GcdsText>
                <GcdsText>
                    {pageContentJson['45']}
                </GcdsText>
            </GcdsDetails>
            <GcdsHeading tag='h2'>
                {pageContentJson['5']}
            </GcdsHeading>
                 <GcdsText><span>{pageContentJson['6']}</span>
                <ul style={{margin: 0}}>
                    <li>{pageContentJson['7']}</li>
                    <li>{pageContentJson['8']}</li>
                </ul>
                {pageContentJson['9']}{" "}
                <strong>{pageContentJson['10']}</strong> {pageContentJson['11']}{" "}
                <GcdsLink href="#" >{pageContentJson['12']}</GcdsLink>
            </GcdsText>
            <GcdsText>
                {pageContentJson['13']} <strong>{pageContentJson['14']}</strong> <span>{pageContentJson['15']}</span>{" "}
                <strong>{pageContentJson['17']}</strong> <span>{pageContentJson['18']}</span>{" "}
                <strong>{pageContentJson['19']}</strong> <span>{pageContentJson['20']}</span>{" "}
                <GcdsLink href="#" >{pageContentJson['21']}</GcdsLink> <span>{pageContentJson['22']}</span>
            </GcdsText>
            <GcdsDetails detailsTitle={pageContentJson['23']}>
                <GcdsText>
                <span>{pageContentJson['24']}</span> <GcdsLink href="#" lang="en"><i>{pageContentJson['27']}</i></GcdsLink> <span>{pageContentJson['28']}</span> <GcdsLink href="#" lang="en"><i>{pageContentJson['29']}</i></GcdsLink>.
                </GcdsText>

                <GcdsText>
                <span>{pageContentJson['30']} </span><GcdsLink href="#" lang="en"> <i>{pageContentJson['31']}</i></GcdsLink> {pageContentJson['32']}
                </GcdsText>

                <GcdsText>
                    {pageContentJson['33']}
                </GcdsText>
            </GcdsDetails>
            <GcdsDetails detailsTitle={pageContentJson['25']}>
                <GcdsText>
                <span>{pageContentJson['34']} </span><GcdsLink href="#" lang="en">{pageContentJson['35']}</GcdsLink> <span>{pageContentJson['36']}</span>{" "}<GcdsLink href="#" lang="en">{pageContentJson['37']}</GcdsLink>.
                </GcdsText>

                <GcdsText>
                <span> {pageContentJson['38']} </span><GcdsLink href="#" lang="en"><span>{pageContentJson['39']}</span></GcdsLink>:
                </GcdsText>

                <GcdsText className="privacy-notice">
                    <GcdsLink href={`mailto:${pageContentJson['40']}`}>{pageContentJson['40']}</GcdsLink><br />
                    <span> {pageContentJson['41']}</span>
                </GcdsText>
            </GcdsDetails>
            <br />
            <SubmitButton currentLang={language} disabled={isPending} />
            <AlreadyGc currentLang={language} />
            </form>
        </GcdsContainer>
    )
}