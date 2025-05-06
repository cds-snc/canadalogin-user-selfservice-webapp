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
import {useUser} from "../../Providers/useUser.tsx";
import {CONTEXT_ACTIONS} from "../../../utils/constants.jsx";
import {useNavigate} from "react-router";
import {NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import { trackEvent } from "../../../utils/gatag.jsx";
import {GA_CATEGORIES, GA_ACTIONS, GA_LABELS} from "../../../utils/constants.jsx";

export default function Privacy() {
    const { language } = useParams();
    const {state, dispatch} = useUser();
    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();
        trackEvent({
            category: GA_CATEGORIES.signup,
            action: GA_ACTIONS.acceptPrivacy,
            label: GA_LABELS.button
          });

        const userData = { ...state.userData, viewPrivacy: true };
        await dispatch({ type: CONTEXT_ACTIONS.signUp, payload: userData });
        navigate("/" + language + NAVIGATION_LINKS.signUp);
    }

    const pageContentJson = getPageContent(language, PAGES.privacy);

    return (
        <GcdsContainer>
             <form  id="form"  onSubmit={handleSubmit}>
            <GcdsHeading tag='h1'>
                {pageContentJson['1']}
                <GcdsText marginTop="150" marginBottom="0">
                    {pageContentJson['2']}
                    <strong>
                        {language === AVAILABLE_LANGUAGES.fr ? ' ' + pageContentJson['3'] + ' ' : ''}
                        {` ${SERVICES[0].title}`}{language === AVAILABLE_LANGUAGES.en ? ' ' + pageContentJson['3'] : ''}
                    </strong>
                </GcdsText>
            </GcdsHeading>
            <GcdsDetails detailsTitle={pageContentJson['42']}>
                <GcdsText>
                <span>{pageContentJson['43']}</span>
                </GcdsText>
                <GcdsText>
                <span>{pageContentJson['44']}</span>
                </GcdsText>
                <GcdsText>
                <span>{pageContentJson['45']}</span>
                </GcdsText>
            </GcdsDetails>
            <GcdsHeading tag='h2'>
                {pageContentJson['5']}
            </GcdsHeading>
            <GcdsText>{pageContentJson['6']}
            </GcdsText>
            <ul>
                <li>{pageContentJson['7']}</li>
                <li>{pageContentJson['8']}</li>
            </ul>
            <GcdsText>
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

                <GcdsText>
                    <GcdsLink href={`mailto:${pageContentJson['40']}`}>{pageContentJson['40']}</GcdsLink><br />
                    <span> {pageContentJson['41']}</span>
                </GcdsText>
            </GcdsDetails>
            <br />
            <SubmitButton currentLang={language} />
            <AlreadyGc currentLang={language} />
            </form>
        </GcdsContainer>
    )
}