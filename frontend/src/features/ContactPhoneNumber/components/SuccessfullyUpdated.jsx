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
import { PAGES } from "../../../utils/constants";

export default function SuccessfullyUpdatedContactPhoneNumber({
  onNext,
  phoneFormData,
}) {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    PAGES.successfullyUpdatedContactPhoneNumber,
  );
  return (
    <GcdsContainer>
      <GcdsGrid columns="1">
        <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            <strong>
              {pageContentJson["1"]} {phoneFormData.formattedPhoneNumber}
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
          <GcdsLink href="#">{pageContentJson["6"]}</GcdsLink>
        </GcdsText>
        <GcdsGrid columns="repeat(auto-fit, minmax(100px, 200px))">
          <GcdsButton
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onNext();
            }}
          >
            {pageContentJson["7"]}
          </GcdsButton>

          <GcdsButton
            buttonRole="secondary"
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onNext();
            }}
          >
            {pageContentJson["8"]}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>

      <GcdsGrid columns="1" gap="150"></GcdsGrid>
    </GcdsContainer>
  );
}
