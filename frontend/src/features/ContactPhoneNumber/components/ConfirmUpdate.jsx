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

export default function ConfirmContactPhoneNumberUpdate({
  onNext,
  phoneFormData,
  onCancel,
}) {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    PAGES.confirmContactPhoneNumberUpdate,
  );

  return (
    <GcdsContainer>
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1" lang={language}>
          {pageContentJson["1"]}
        </GcdsHeading>
        <div>
          <GcdsText marginBottom="0">{pageContentJson["2"]}</GcdsText>
          <GcdsText marginTop="0">
            <strong>{phoneFormData.formattedPhoneNumber}</strong>
          </GcdsText>
        </div>

        <GcdsText>
          {pageContentJson["4"]}
          <ul>
            <li>{pageContentJson["5"]}</li>
          </ul>
        </GcdsText>
        <GcdsNotice type="info" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            {pageContentJson["6"]} <strong>{pageContentJson["7"]}</strong>
            <GcdsText>
              {pageContentJson["8"]}{" "}
              <GcdsLink href="https://accounts.gc.ca/directory">
                {pageContentJson["9"]}
              </GcdsLink>
            </GcdsText>
          </GcdsText>
        </GcdsNotice>
        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            style={{ width: "fit-content" }}
            onGcdsClick={async (ev) => {
              ev.preventDefault();
              onNext();
            }}
          >
            {pageContentJson["10"]}
          </GcdsButton>
          <GcdsButton
            buttonRole="secondary"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onCancel();
            }}
          >
            {pageContentJson["11"]}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
