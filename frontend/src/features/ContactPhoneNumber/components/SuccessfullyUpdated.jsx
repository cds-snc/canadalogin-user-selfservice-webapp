import { useParams } from "react-router";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
  GcdsLink,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions.jsx";
import { EXTERNAL_NAVIGATION_LINKS, PAGES } from "../../../utils/constants";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";

export default function SuccessfullyUpdated({
  onNext,
  onCancel,
  phoneFormData,
}) {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    PAGES.successfullyUpdatedContactPhoneNumber,
  );

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    onNext();
  };

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1">
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            <strong>
              {pageContentJson["1"]} {phoneFormData?.formattedPhoneNumber || ""}
            </strong>
          </GcdsText>
        </GcdsNotice>
        <GcdsHeading marginBottom="150" tag="h1">
          {pageContentJson["2"]}
        </GcdsHeading>

        <GcdsHeading marginTop="0" marginBottom="0" tag="h3">
          {pageContentJson["3"]}
        </GcdsHeading>

        <GcdsText>{pageContentJson["4"]}</GcdsText>
        <GcdsText>
          {pageContentJson["5"]}{" "}
          <GcdsLink href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}>
            {pageContentJson["6"]}
          </GcdsLink>
        </GcdsText>
        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            style={{ width: "fit-content" }}
            onGcdsClick={onSubmitHandler}
            currentLang={language}
          >
            {pageContentJson["7"]}
          </SubmitButton>

          <GcdsButton
            buttonRole="secondary"
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onCancel();
            }}
          >
            {pageContentJson["8"]}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
