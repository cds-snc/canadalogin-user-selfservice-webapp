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

import { getPageContent } from "../../../utils/functions";
import { gcHelpCentreLinks } from "../../../utils/gcHelpCentreLinks";

import { FLOW_TYPES, PAGES } from "../../../utils/constants";
import SubmitButton from "../../../components/Layout/SubmitButton";

export default function OtpSelection({
  onNext,
  userSelectedMfaFactor,
  onChangeUserSelectedMfaFactor,
  userPhoneFactors,
  parentPage,
  onCancel,
}) {
  const { language } = useParams();

  const pageContentJson = getPageContent(language, PAGES.transientOtpSelection);

  const { cancel } = getPageContent(language, "Button");

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await onNext();
  };

  const configureRadioSMSOptions = () => {
    let radioOptionsValues = [];

    const smsPhoneFactors = userPhoneFactors?.filter(
      (factor) => factor.type === FLOW_TYPES.sms,
    );

    // Add all SMS factors as radio options
    smsPhoneFactors?.forEach((smsPhoneFactor) => {
      const smsLabel = `${pageContentJson["8"]} ${smsPhoneFactor.destination}`;
      const smsOtpRadioOption = {
        label: smsLabel,
        id: `${FLOW_TYPES.sms}-${smsPhoneFactor.id}`,
        value: smsPhoneFactor.id,
        checked: userSelectedMfaFactor?.id == smsPhoneFactor.id,
      };
      radioOptionsValues.push(smsOtpRadioOption);
    });

    return radioOptionsValues;
  };

  const configureRadioVoiceOptions = () => {
    let radioOptionsValues = [];

    const voicePhoneFactors = userPhoneFactors?.filter(
      (factor) => factor.type === FLOW_TYPES.voice,
    );

    // Add all Voice factors as radio options
    voicePhoneFactors?.forEach((voicePhoneFactor) => {
      const voiceLabel = `${pageContentJson["9"]} ${voicePhoneFactor.destination}`;
      const voiceOtpRadioOption = {
        label: voiceLabel,
        id: `${FLOW_TYPES.voice}-${voicePhoneFactor.id}`,
        value: voicePhoneFactor.id,
        checked: userSelectedMfaFactor?.id == voicePhoneFactor.id,
      };
      radioOptionsValues.push(voiceOtpRadioOption);
    });

    return radioOptionsValues;
  };

  const radioSMSOptions = configureRadioSMSOptions();
  const radioVoiceOptions = configureRadioVoiceOptions();
  const combinedOptions = [...radioSMSOptions, ...radioVoiceOptions];

  const parentPageContent =
    parentPage === PAGES.deleteMFAPage
      ? pageContentJson["15"]
      : parentPage === PAGES.addMFAPage
        ? pageContentJson["14"]
        : pageContentJson["2"];

  const radioComponent =
    combinedOptions.length >= 2 ? (
      <GcdsRadios
        name="combinedRadio"
        legend={pageContentJson["16"]}
        options={combinedOptions}
        onGcdsChange={(e) => onChangeUserSelectedMfaFactor(e.target.value)}
      ></GcdsRadios>
    ) : (
      <>
        <GcdsText>{combinedOptions[0]?.label}</GcdsText>
        <GcdsText>{combinedOptions[0]?.hint}</GcdsText>
      </>
    );

  return (
    <GcdsContainer role="main">
      <GcdsContainer className="gcds-gap">
        <GcdsHeading tag="h1" lang={language}>
          {pageContentJson["1"]}
        </GcdsHeading>
      </GcdsContainer>
      <GcdsContainer>
        <GcdsContainer>
          <GcdsText>
            {parentPageContent} {pageContentJson["3"]}
          </GcdsText>
        </GcdsContainer>
        <GcdsContainer>
          <GcdsHeading tag="h2">{pageContentJson["4"]}</GcdsHeading>
          <GcdsText>
            {pageContentJson["5"]} <strong>{pageContentJson["6"]}</strong>{" "}
            {pageContentJson["7"]}
          </GcdsText>
        </GcdsContainer>
        <form onSubmit={onSubmitHandler}>{radioComponent}</form>

        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            style={{ width: "fit-content" }}
            onGcdsClick={onSubmitHandler}
            currentLang={language}
          ></SubmitButton>

          <GcdsButton
            buttonRole="secondary"
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onCancel();
            }}
          >
            {cancel}
          </GcdsButton>
        </GcdsGrid>
      </GcdsContainer>

      <GcdsContainer>
        <GcdsHeading tag="h2">{pageContentJson["10"]}</GcdsHeading>
        <GcdsText>
          <GcdsLink
            href={gcHelpCentreLinks.twoStepVerification}
            target="_blank"
          >
            {pageContentJson["12"]}
          </GcdsLink>
        </GcdsText>
        <GcdsText>
          <GcdsLink
            href={gcHelpCentreLinks.recover2StepVerification}
            target="_blank"
          >
            {pageContentJson["13"]}
          </GcdsLink>
        </GcdsText>
      </GcdsContainer>
    </GcdsContainer>
  );
}
