import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsIcon,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";

import { getPageContent } from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";
import RPNameDisplay from "../../../components/RPInfo/RPNameDisplay";
import SubmitButton from "../../../components/Layout/SubmitButton";
import { path } from "../../../utils/routeHelpers";
import type {
  ContactPhoneConfirmUpdateProps,
  ContactPhonePageContent,
} from "../../../types/contactPhoneNumber";

export default function ConfirmUpdate({
  onNext,
  phoneFormData,
  onCancel,
  errorMessage,
  setErrorCode,
  localLoading,
}: ContactPhoneConfirmUpdateProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const pageContentJson =
    (getPageContent(language, PAGES.confirmContactPhoneNumberUpdate) as
      | ContactPhonePageContent
      | undefined) ?? {};

  const manage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language,
  });

  const onSubmitClick = (event: CustomEvent<string | void>) => {
    event.preventDefault();
    if (setErrorCode) {
      setErrorCode("");
    }
    void onNext();
  };

  return (
    <GcdsContainer role="main">
      {errorMessage ? (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      ) : null}
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
            <li>
              <RPNameDisplay rpName={pageContentJson["5"]} />
            </li>
          </ul>
        </GcdsText>

        <GcdsNotice type="info" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsIcon name="warning-triangle" size="text-small" />
          <GcdsText>
            {pageContentJson["6"]} <strong>{pageContentJson["7"]}</strong>
            <GcdsText>
              {pageContentJson["8"]}{" "}
              <GcdsLink href={manage2FAVerificationsPage}>
                {pageContentJson["9"]}
              </GcdsLink>
            </GcdsText>
          </GcdsText>
        </GcdsNotice>
        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            disabled={localLoading}
            style={{ width: "fit-content" }}
            onGcdsClick={onSubmitClick}
            currentLang={language}
          >
            {pageContentJson["10"]}
          </SubmitButton>
          <GcdsButton
            buttonRole="secondary"
            disabled={localLoading}
            onGcdsClick={(event: Event) => {
              event.preventDefault();
              void onCancel();
            }}
          >
            {pageContentJson["11"]}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
