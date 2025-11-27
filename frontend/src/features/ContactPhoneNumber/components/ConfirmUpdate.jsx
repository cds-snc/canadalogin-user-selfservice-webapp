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
import parsePhoneNumberFromString from "libphonenumber-js";
import { getPageContent } from "../../../utils/functions.jsx";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection.jsx";
import { PAGES } from "../../../utils/constants";

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

  // Format phone number with fallback logic
  const getFormattedPhoneNumber = () => {
    try {
      const parsedPhoneNumber = parsePhoneNumberFromString(
        phoneFormData.phoneNumber,
      );
      if (parsedPhoneNumber) {
        // Custom format: "+1 (778) 384-6499"
        const internationalFormat = parsedPhoneNumber.formatInternational();
        // Transform "+1 778 384 6499" to "+1 (778) 384-6499"
        return internationalFormat.replace(
          /^\+1 (\d{3}) (\d{3}) (\d{4})$/,
          "+1 ($1) $2-$3",
        );
      }
    } catch (error) {
      console.warn(
        `Failed to parse phone number: ${phoneFormData.phoneNumber}`,
      );
      console.warn(`Failed to parse phone number: ${error}`);
    }

    // Fallback to formattedPhoneNumber if parsing fails
    if (phoneFormData.formattedPhoneNumber) {
      return phoneFormData.formattedPhoneNumber;
    }

    // Final fallback to raw phoneNumber
    return phoneFormData.phoneNumber;
  };

  return (
    <GcdsContainer>
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
            <strong>{getFormattedPhoneNumber()}</strong>
          </GcdsText>
        </div>

        <GcdsText>
          {pageContentJson["4"]}
          <ul>
            <li>{pageContentJson["5"]}</li>
          </ul>
        </GcdsText>

        <ServicesWithAccessInfoSection currentLang={language} />

        <GcdsNotice type="info" noticeTitleTag="h2" noticeTitle="Heads up">
          <GcdsIcon name="warning" size="small" />
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
            disabled={localLoading}
            style={{ width: "fit-content" }}
            onGcdsClick={async (ev) => {
              ev.preventDefault();
              // Clear error when user clicks
              if (setErrorCode) {
                setErrorCode("");
              }
              onNext();
            }}
          >
            {pageContentJson["10"]}
          </GcdsButton>
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
