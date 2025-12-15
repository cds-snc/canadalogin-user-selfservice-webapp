import { useParams } from "react-router";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";

export default function EditEmailEnterEmail() {
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.editEmailEnterEmail);
  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1" lang={language}>
        {pageContentJson["14"]}
      </GcdsHeading>
    </GcdsContainer>
  );
}
