import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsRadios,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";
import { useNavigateHelper } from "../../../hooks/useNavigate.js";

import { getPageContent } from "../../../utils/functions.jsx";
import { gcHelpCentreLinks } from "../../../utils/gcHelpCentreLinks.jsx";
import { path } from "../../../utils/routeHelpers.js";

import { FLOW_TYPES, PAGES } from "../../../utils/constants.jsx";

export default function OtpSelection({
  onNext,
  userSelectedMfaFactor,
  onChangeUserSelectedMfaFactor,
  userPhoneFactors,
}) {
  const { language } = useParams();
  const navigateHelper = useNavigateHelper();

  const pageContentJson = getPageContent(language, PAGES.transientOtpSelection);

  const { submit, cancel } = getPageContent(language, "Button");
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });
  const configureRadioOptions = () => {
    let radioOptionsValues = [];

    const smsPhoneFactorValue = userPhoneFactors.find(
      (factor) => factor.type === FLOW_TYPES.sms,
    );
    const voicePhoneFactorValue = userPhoneFactors.find(
      (factor) => factor.type === FLOW_TYPES.voice,
    );

    if (smsPhoneFactorValue) {
      const smsLabel = `${pageContentJson["8"]} ${smsPhoneFactorValue.phoneNumber}`;
      const smsOtpRadioOption = {
        label: smsLabel,
        id: FLOW_TYPES.sms,
        value: smsPhoneFactorValue.id,
        checked: userSelectedMfaFactor?.id == smsPhoneFactorValue.id,
      };
      radioOptionsValues.push(smsOtpRadioOption);
    }

    if (voicePhoneFactorValue) {
      const voiceLabel = `${pageContentJson["9"]} ${voicePhoneFactorValue.phoneNumber}`;
      const voiceOtpRadioOption = {
        label: voiceLabel,
        id: FLOW_TYPES.voice,
        value: voicePhoneFactorValue.id,
        checked: userSelectedMfaFactor?.id == voicePhoneFactorValue.id,
      };
      radioOptionsValues.push(voiceOtpRadioOption);
    }

    return radioOptionsValues;
  };

  const radioOptions = configureRadioOptions();

  return (
    <GcdsContainer>
      <GcdsContainer className="gcds-gap">
        <GcdsHeading tag="h1" lang={language}>
          {pageContentJson["1"]}
        </GcdsHeading>
      </GcdsContainer>
      <GcdsContainer>
        <GcdsContainer>
          <GcdsText>
            {pageContentJson["2"]} {pageContentJson["3"]}
          </GcdsText>
          <GcdsText>
            <GcdsLink
              href={gcHelpCentreLinks.twoStepVerification}
              target="_blank"
            >
              {pageContentJson["3"]}
            </GcdsLink>
          </GcdsText>
        </GcdsContainer>
        {radioOptions.length > 1 ? (
          <GcdsRadios
            name="radio"
            legend={pageContentJson["4"]}
            hint={`${pageContentJson["5"]} ${pageContentJson["6"]} ${pageContentJson["7"]}`}
            options={radioOptions}
            onGcdsChange={(e) => onChangeUserSelectedMfaFactor(e.target.value)}
          ></GcdsRadios>
        ) : (
          <>
            <GcdsText>{radioOptions[0]?.label}</GcdsText>
            <GcdsText>{radioOptions[0]?.hint}</GcdsText>
          </>
        )}

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onNext();
            }}
          >
            {submit}
          </GcdsButton>

          <GcdsButton
            buttonRole="secondary"
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              navigateHelper(backToManage2FAVerificationsPage);
            }}
          >
            {cancel}
          </GcdsButton>
        </GcdsGrid>
      </GcdsContainer>
    </GcdsContainer>
  );
}
