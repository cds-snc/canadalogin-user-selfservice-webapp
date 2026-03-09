import { useParams } from "react-router";
import { getPageContent } from "../../../../utils/functions";
import { PAGES } from "../../../../utils/constants";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsNotice,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import FIDOPasskeyCollage from "../../../../assets/icons/passkey_collage.svg?react";

export default function AddFIDO2Passkey({
  errorMessage,
  onCancel,
  onRegister,
  registrationLoading,
}) {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.addFIDO2Passkey);

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1" lang={language}>
          {pageContent["1"]}
        </GcdsHeading>
        <GcdsContainer>
          <FIDOPasskeyCollage />
        </GcdsContainer>
        <ol className="passkey-steps">
          <li>
            <GcdsText marginBottom="0">
              <strong>{pageContent["2"]}</strong>
            </GcdsText>
            <GcdsText>{pageContent["3"]}</GcdsText>
          </li>
          <li>
            <GcdsText marginBottom="0">
              <strong>{pageContent["4"]}</strong>
            </GcdsText>
            <GcdsText>
              {pageContent["5"]} <strong>{pageContent["6"]}</strong>{" "}
              {pageContent["7"]}
            </GcdsText>
          </li>
          <li>
            <GcdsText marginBottom="0">
              <strong>{pageContent["8"]}</strong>
            </GcdsText>
          </li>
        </ol>
        <GcdsNotice
          type="warning"
          noticeTitleTag="h2"
          noticeTitle={" "}
          lang={language}
        >
          <GcdsText>
            {pageContent["9"]} <strong>{pageContent["10"]}</strong>
          </GcdsText>
        </GcdsNotice>

        {errorMessage && (
          <GcdsErrorMessage messageId="message-props">
            {errorMessage}
          </GcdsErrorMessage>
        )}
        <GcdsButton
          onClick={async (e) => {
            e.preventDefault();
            await onRegister();
          }}
          disabled={registrationLoading}
        >
          {pageContent["11"]}
        </GcdsButton>
        <GcdsButton
          buttonRole="secondary"
          onClick={onCancel}
          disabled={registrationLoading}
        >
          {pageContent["12"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
