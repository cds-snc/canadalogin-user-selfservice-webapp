import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";

import { getPageContent } from "../../../utils/functions";
import { EXTERNAL_NAVIGATION_LINKS, PAGES } from "../../../utils/constants";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type {
  ContactPhonePageContent,
  ContactPhoneSuccessProps,
} from "../../../types/contactPhoneNumber";

export default function SuccessfullyUpdated({
  onNext,
  onCancel,
  phoneFormData,
}: ContactPhoneSuccessProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const pageContentJson =
    (getPageContent(language, PAGES.successfullyUpdatedContactPhoneNumber) as
      | ContactPhonePageContent
      | undefined) ?? {};

  const onSubmitClick = (event: CustomEvent<string | void>) => {
    event.preventDefault();
    void onNext();
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
            onGcdsClick={onSubmitClick}
            currentLang={language}
          >
            {pageContentJson["7"]}
          </SubmitButton>

          <GcdsButton
            buttonRole="secondary"
            style={{ width: "fit-content" }}
            onGcdsClick={(event: Event) => {
              event.preventDefault();
              void onCancel();
            }}
          >
            {pageContentJson["8"]}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
