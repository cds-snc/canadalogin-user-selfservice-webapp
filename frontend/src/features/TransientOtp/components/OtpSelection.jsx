import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { useParams } from "react-router";

import { getPageContent } from "../../../utils/functions";
import { gcHelpCentreLinks } from "../../../utils/gcHelpCentreLinks";

import { FLOW_TYPES, PAGES } from "../../../utils/constants";
import SMSIcon from "../../../assets/icons/sms_icon.svg?react";
import VoiceIcon from "../../../assets/icons/voicecall_icon.svg?react";
import FIDO2Icon from "../../../assets/icons/FIDO_Passkey_mark_A_black.svg?react";

const headerGridProps = {
  columns: "max-content 1fr",
  gap: "150",
  "align-items": "center",
  style: { alignItems: "center", paddingTop: "3rem", paddingBottom: "1.5rem" },
};

function SectionHeader({ icon, title, paddingBottom }) {
  return (
    <GcdsGrid
      {...headerGridProps}
      style={{ ...headerGridProps.style, paddingBottom }}
    >
      {icon}
      <GcdsHeading tag="h3" marginTop="0" marginBottom="0">
        {title}
      </GcdsHeading>
    </GcdsGrid>
  );
}

export default function OtpSelection({
  onNext,
  onChangeUserSelectedMfaFactor,
  userPhoneFactors,
  fido2Data,
  onSelectFIDO2,
  parentPage,
  onCancel,
}) {
  const { language } = useParams();

  const pageContentJson = getPageContent(language, PAGES.transientOtpSelection);
  const { cancel } = getPageContent(language, "Button");

  const smsFactors =
    userPhoneFactors?.filter((f) => f.type === FLOW_TYPES.sms) ?? [];
  const voiceFactors =
    userPhoneFactors?.filter((f) => f.type === FLOW_TYPES.voice) ?? [];
  const hasFido2 = fido2Data && fido2Data.length > 0;

  const handlePhoneFactorSelect = (factorId) => {
    onChangeUserSelectedMfaFactor(factorId);
    onNext();
  };

  const parentPageContent =
    parentPage === PAGES.deleteMFAPage
      ? pageContentJson["15"]
      : parentPage === PAGES.addMFAPage
        ? pageContentJson["14"]
        : parentPage === PAGES.deleteFIDO2PasskeyPage
          ? pageContentJson["22"]
          : parentPage === PAGES.addFIDO2PasskeyPage
            ? pageContentJson["23"]
            : pageContentJson["2"];

  const factorRowStyle = {
    borderBottom: "0.0625rem solid #A5A5A5",
    paddingBottom: "1.5rem",
    paddingTop: "1.5rem",
  };

  const factorListStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  };

  return (
    <GcdsContainer role="main">
      <GcdsContainer className="gcds-gap">
        <GcdsHeading tag="h1" lang={language}>
          {pageContentJson["1"]}
        </GcdsHeading>
        <GcdsText>
          {parentPageContent} {pageContentJson["3"]}
        </GcdsText>
      </GcdsContainer>
      <GcdsContainer>
        <GcdsHeading tag="h2" marginTop="600" marginBottom="300">
          {pageContentJson["21"]}
        </GcdsHeading>
        {/* Text message section */}
        {smsFactors.length > 0 && (
          <GcdsContainer>
            <SectionHeader
              icon={<SMSIcon width="23" height="23" />}
              title={pageContentJson["8"]}
            />
            <GcdsContainer style={factorListStyle}>
              <GcdsText marginBottom="0">
                {pageContentJson["5"]} <strong>{pageContentJson["6"]}</strong>{" "}
                {pageContentJson["7"]}
              </GcdsText>
              {smsFactors.map((factor) => (
                <GcdsGrid
                  key={factor.id}
                  columns="1fr auto"
                  align-items="center"
                  style={factorRowStyle}
                >
                  <GcdsText marginBottom="0">{factor.destination}</GcdsText>
                  <GcdsLink
                    size="regular"
                    role="button"
                    onGcdsClick={() => handlePhoneFactorSelect(factor.id)}
                  >
                    {pageContentJson["18"]}
                  </GcdsLink>
                </GcdsGrid>
              ))}
            </GcdsContainer>
          </GcdsContainer>
        )}

        {/* Voice call section */}
        {voiceFactors.length > 0 && (
          <GcdsContainer>
            <SectionHeader
              icon={<VoiceIcon width="23" height="23" />}
              title={pageContentJson["9"]}
            />
            <GcdsContainer style={factorListStyle}>
              <GcdsText marginBottom="0">
                {pageContentJson["5"]} <strong>{pageContentJson["6"]}</strong>{" "}
                {pageContentJson["7"]}
              </GcdsText>
              {voiceFactors.map((factor) => (
                <GcdsGrid
                  key={factor.id}
                  columns="1fr auto"
                  align-items="center"
                  style={factorRowStyle}
                >
                  <GcdsText marginBottom="0">{factor.destination}</GcdsText>
                  <GcdsLink
                    size="regular"
                    role="button"
                    onGcdsClick={() => handlePhoneFactorSelect(factor.id)}
                  >
                    {pageContentJson["19"]}
                  </GcdsLink>
                </GcdsGrid>
              ))}
            </GcdsContainer>
          </GcdsContainer>
        )}

        {/* Passkey or security key section */}
        {hasFido2 && (
          <GcdsContainer>
            <SectionHeader
              icon={<FIDO2Icon width="34" height="34" />}
              title={pageContentJson["17"]}
              paddingBottom="0"
            />
            <GcdsContainer style={factorListStyle}>
              {fido2Data.map((passkey) => (
                <GcdsGrid
                  key={passkey.id}
                  columns="1fr auto"
                  align-items="center"
                  style={factorRowStyle}
                >
                  <GcdsText marginBottom="0">
                    {passkey.attributes?.nickname ?? passkey.id}
                  </GcdsText>
                  <GcdsLink
                    size="regular"
                    role="button"
                    onGcdsClick={() => onSelectFIDO2 && onSelectFIDO2(passkey)}
                  >
                    {pageContentJson["20"]}
                  </GcdsLink>
                </GcdsGrid>
              ))}
            </GcdsContainer>
          </GcdsContainer>
        )}

        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content", marginTop: "1.5rem" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            onCancel();
          }}
        >
          {cancel}
        </GcdsButton>
      </GcdsContainer>

      <GcdsContainer>
        <GcdsHeading tag="h2" marginTop="600" marginBottom="300">
          {pageContentJson["10"]}
        </GcdsHeading>
        <GcdsText>
          <GcdsLink
            href={gcHelpCentreLinks.twoStepVerification}
            target="_blank"
          >
            {pageContentJson["12"]}
          </GcdsLink>
        </GcdsText>
      </GcdsContainer>
    </GcdsContainer>
  );
}
