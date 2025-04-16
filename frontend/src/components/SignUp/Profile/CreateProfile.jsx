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

export default function CreateProfile({ currentLang }) {
    const pageContentJson = getPageContent(currentLang, "CreateProfile");
    const pageContentJsonHome = getPageContent(currentLang, "Home");

    return (
        <GcdsContainer>
            <GcdsHeading tag='h1'>
                {pageContentJson['1']}
                <GcdsText>{pageContentJson['2']}
                </GcdsText>
            </GcdsHeading>
            <GcdsDetails detailsTitle={pageContentJsonHome['4']}>
                <GcdsText>
                    {pageContentJsonHome['5']}
                </GcdsText>
                <GcdsText>
                    {pageContentJsonHome['6']}
                </GcdsText>
                <GcdsText>
                    {pageContentJsonHome['7']}
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
            <GcdsText tag="p">
                {pageContentJson['9']}{" "}
                <strong>{pageContentJson['10']}</strong> {pageContentJson['11']}{" "}
                <GcdsLink href="#" >{pageContentJson['12']}</GcdsLink>
            </GcdsText>
            <GcdsText tag="p">
                {pageContentJson['13']} <strong>{pageContentJson['14']}</strong> {pageContentJson['15']}{" "}
                <strong>{pageContentJson['17']}</strong> {pageContentJson['18']}{" "}
                <strong>{pageContentJson['19']}</strong>{pageContentJson['20']}{" "}
                <GcdsLink href="#" >{pageContentJson['21']}</GcdsLink> {pageContentJson['22']}
            </GcdsText>
            <GcdsDetails detailsTitle={pageContentJson['23']}>
                <GcdsText tag="p">
                    {pageContentJson['24']} <GcdsLink href="#" lang="en">{pageContentJson['27']}</GcdsLink> {pageContentJson['28']} <GcdsLink href="#" lang="en">{pageContentJson['29']}</GcdsLink>.
                </GcdsText>

                <GcdsText tag="p">
                    {pageContentJson['30']} <GcdsLink href="#" lang="en">{pageContentJson['31']}</GcdsLink> {pageContentJson['32']}
                </GcdsText>

                <GcdsText tag="p">
                    {pageContentJson['33']}
                </GcdsText>
            </GcdsDetails>
            <GcdsDetails detailsTitle={pageContentJson['25']}>
                <GcdsText tag="p">
                    {pageContentJson['34']} <GcdsLink href="#" lang="en">{pageContentJson['35']}</GcdsLink> {pageContentJson['36']} <GcdsLink href="#" lang="en">{pageContentJson['37']}</GcdsLink>.
                </GcdsText>

                <GcdsText tag="p">
                    {pageContentJson['38']} <GcdsLink href="#" lang="en">{pageContentJson['39']}</GcdsLink>:
                </GcdsText>

                <GcdsText tag="p">
                    <GcdsLink href="">{pageContentJson['40']}</GcdsLink><br />
                    {pageContentJson['41']}
                </GcdsText>
            </GcdsDetails>
            <br />
            <SubmitButton currentLang={currentLang} />
            <AlreadyGc currentLang={currentLang} />
        </GcdsContainer>
    )
}

