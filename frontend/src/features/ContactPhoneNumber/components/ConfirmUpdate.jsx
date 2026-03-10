import { useParams } from "react-router";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsNotice,
  GcdsButton,
  GcdsGrid,
  GcdsLink,
  GcdsErrorMessage,
  GcdsIcon,
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";
import RPNameDisplay from "../../../components/RPInfo/RPNameDisplay";
import SubmitButton from "../../../components/Layout/SubmitButton";
import { path } from "../../../utils/routeHelpers";

export default function ConfirmUpdate({
  onNext,
  phoneFormData,
  onCancel,
  errorMessage,
  setErrorCode,
  localLoading,
}) {
  const { language } = useParams();
  const pageContentJson = getPageContent(
    language,
    PAGES.confirmContactPhoneNumberUpdate,
  );

  const manage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language,
  });
  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    // Clear error when user clicks
    if (setErrorCode) {
      setErrorCode("");
    }
    await onNext();
  };

  return (
    <GcdsContainer role="main">
      {errorMessage && (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      )}
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
          <GcdsIcon name="warning" size="small" />
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
            onGcdsClick={onSubmitHandler}
            currentLang={language}
          >
            {pageContentJson["10"]}
          </SubmitButton>
          <GcdsButton
            buttonRole="secondary"
            disabled={localLoading}
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
