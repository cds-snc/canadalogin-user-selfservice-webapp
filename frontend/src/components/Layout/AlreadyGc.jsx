import { GcdsHeading, GcdsLink, GcdsText } from "@cdssnc/gcds-components-react";
import { useNavigate } from "react-router";
import { getPageContent } from "../../utils/functions";



export default function AlreadyGc({ currentLang }) {
    const pageContentJson = getPageContent(currentLang, "AlreadyGc");
    const navigate = useNavigate();

    return (
        <GcdsHeading tag="h3">
            {pageContentJson['1']}
            <GcdsText marginTop="200" marginBottom="0">
                <GcdsLink
                    onClick={() => {
                        navigate(`/${currentLang}`);
                    }} >
                    {pageContentJson['2']}
                </GcdsLink>
            </GcdsText>
        </GcdsHeading>
    )
}