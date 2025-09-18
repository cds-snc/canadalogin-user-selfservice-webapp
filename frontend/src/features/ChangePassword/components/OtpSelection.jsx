import { useParams } from "react-router";
import {
  GcdsContainer,
  GcdsRadios,
  GcdsLink,
  GcdsText,
  GcdsGrid,
  GcdsButton,
  GcdsHeading,
} from "@cdssnc/gcds-components-react";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";

import { getPageContent } from "../../../utils/functions.jsx";
import { gcHelpCentreLinks } from "../../../utils/gcHelpCentreLinks.jsx";
import { path } from "../../../utils/routeHelpers.js";

import { FLOW_TYPES, PAGES } from "../../../utils/constants.jsx";

export default function OtpSelection({
  onNext,
  userSelectedMfaType,
  onChangeUserMfaType,
  userPhoneFactors,
}) {
  const { language } = useParams();
  const navigateHelper = useNavigateHelper();

  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  const { submit, cancel } = getPageContent(language, "Button");
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
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
      const smsLabel = `${pageContentJson["7"]} ${smsPhoneFactorValue.phoneNumber}`;
      const smsOtpRadioOption = {
        label: smsLabel,
        id: FLOW_TYPES.sms,
        value: FLOW_TYPES.sms,
        hint: pageContentJson["8"],
        checked: userSelectedMfaType.type == FLOW_TYPES.sms,
      };
      radioOptionsValues.push(smsOtpRadioOption);
    }

    if (voicePhoneFactorValue) {
      const voiceLabel = `${pageContentJson["9"]} ${voicePhoneFactorValue.phoneNumber}`;
      const voiceOtpRadioOption = {
        label: voiceLabel,
        id: FLOW_TYPES.voice,
        value: FLOW_TYPES.voice,
        hint: pageContentJson["10"],
        checked: userSelectedMfaType.type == FLOW_TYPES.voice,
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
          <GcdsText>{pageContentJson["4"]}</GcdsText>
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
            legend={pageContentJson["5"]}
            options={radioOptions}
            onGcdsChange={(e) => onChangeUserMfaType(e.target.value)}
          ></GcdsRadios>
        ) : (
          <>
            <GcdsText>{radioOptions[0].label}</GcdsText>
            <GcdsText>{radioOptions[0].hint}</GcdsText>
          </>
        )}

        <GcdsGrid
          columns="repeat(auto-fit, minmax(100px, 100px))"
          gap="10px"
          align-items="center"
        >
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
              navigateHelper(backToSecuritySettingsPage);
            }}
          >
            {cancel}
          </GcdsButton>
        </GcdsGrid>
      </GcdsContainer>
    </GcdsContainer>
  );
}
