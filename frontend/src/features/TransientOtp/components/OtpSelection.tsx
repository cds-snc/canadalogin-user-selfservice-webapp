import type { ReactNode } from "react";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";
import { useParams } from "react-router";

import { useTranslation } from "react-i18next";
import { gcHelpCentreLinks } from "../../../utils/gcHelpCentreLinks";

import { FLOW_TYPES, PAGES } from "../../../utils/constants";
import type { Fido2Credential, OtpFactor } from "../../../types/hooks";
import SMSIcon from "../../../assets/icons/sms_icon.svg?react";
import VoiceIcon from "../../../assets/icons/voicecall_icon.svg?react";
import FIDO2Icon from "../../../assets/icons/FIDO_Passkey_mark_A_black.svg?react";
import EmailIcon from "../../../assets/icons/email_icon.svg?react";

const headerGridProps = {
  columns: "max-content 1fr",
  gap: "150",
  "align-items": "center",
  style: { alignItems: "center", paddingTop: "3rem", paddingBottom: "1.5rem" },
} as const;

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  paddingBottom?: string;
}

function SectionHeader({ icon, title, paddingBottom }: SectionHeaderProps) {
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

interface OtpSelectionProps {
  onNext: () => void;
  onChangeUserSelectedMfaFactor: (factorId: string) => void;
  userPhoneFactors?: OtpFactor[] | null;
  fido2Data?: Fido2Credential[] | null;
  onSelectFIDO2?: (passkey: Fido2Credential) => void;
  parentPage: string;
  onCancel: () => void;
  emailAddress?: string | null;
  onSelectEmail?: () => void;
}

function getLastFourDigits(value?: string | null) {
  if (!value) {
    return "";
  }

  const digits = value.replace(/\D/g, "");
  return digits.slice(-4);
}

function getMaskedPhoneDestination(destination?: string | null) {
  if (!destination) {
    return "";
  }

  if (destination.includes("*")) {
    return destination;
  }

  const lastFourDigits = getLastFourDigits(destination);
  return lastFourDigits ? `******-${lastFourDigits}` : destination;
}

export default function OtpSelection({
  onNext,
  onChangeUserSelectedMfaFactor,
  userPhoneFactors,
  fido2Data,
  onSelectFIDO2,
  parentPage,
  onCancel,
  emailAddress,
  onSelectEmail,
}: OtpSelectionProps) {
  const { language } = useParams();

  const { t } = useTranslation(["otp", "common"]);

  const smsFactors =
    userPhoneFactors?.filter((f) => f.type === FLOW_TYPES.sms) ?? [];
  const voiceFactors =
    userPhoneFactors?.filter((f) => f.type === FLOW_TYPES.voice) ?? [];
  const hasFido2 = fido2Data && fido2Data.length > 0;

  const handlePhoneFactorSelect = (factorId: string) => {
    onChangeUserSelectedMfaFactor(factorId);
    onNext();
  };

  const pageContentMap: Record<string, string> = {
    [PAGES.deleteMFAPage]: t("TransientOtpSelection.toDeleteNumber"),
    [PAGES.addMFAPage]: t("TransientOtpSelection.toAddPhone"),
    [PAGES.addFIDO2PasskeyPage]: t("TransientOtpSelection.toAddPasskey"),
    [PAGES.deleteFIDO2PasskeyPage]: t("TransientOtpSelection.toDeletePasskey"),
    [PAGES.password]: t("TransientOtpSelection.toChangePassword"),
  };
  const parentPageContent =
    pageContentMap[parentPage] || t("TransientOtpSelection.toChangePassword");

  const factorRowStyle = {
    borderBottom: "0.0625rem solid #A5A5A5",
    paddingBottom: "1.5rem",
    paddingTop: "1.5rem",
  };

  const factorListStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.5rem",
  };

  return (
    <GcdsContainer role="main">
      <GcdsContainer className="gcds-gap">
        <GcdsHeading tag="h1" lang={language}>
          {t("TransientOtpSelection.title")}
        </GcdsHeading>
        <GcdsText>
          {parentPageContent} {t("TransientOtpSelection.firstComplete2Step")}
        </GcdsText>
      </GcdsContainer>
      <GcdsContainer>
        <GcdsHeading tag="h2" marginTop="600" marginBottom="300">
          {t("TransientOtpSelection.chooseVerifyMethod")}
        </GcdsHeading>
        {/* Text message section */}
        {smsFactors.length > 0 && (
          <GcdsContainer>
            <SectionHeader
              icon={<SMSIcon width="23" height="23" />}
              title={t("TransientOtpSelection.textMessage") ?? ""}
            />
            <GcdsContainer style={factorListStyle}>
              <GcdsText marginBottom="0">
                {t("TransientOtpSelection.codeExpiresIn")}{" "}
                <strong>{t("TransientOtpSelection.tenMinutes")}</strong>{" "}
                {t("TransientOtpSelection.carrierCharges")}
              </GcdsText>
              {smsFactors.map((factor) => (
                <GcdsGrid
                  key={factor.id}
                  columns="1fr auto"
                  align-items="center"
                  style={factorRowStyle}
                >
                  <GcdsText marginBottom="0">
                    {getMaskedPhoneDestination(factor.destination)}
                  </GcdsText>
                  <GcdsLink
                    size="regular"
                    role="button"
                    aria-label={t("TransientOtpSelection.textMeEndingIn", {
                      digits: getLastFourDigits(factor.destination),
                    })}
                    onGcdsClick={() => handlePhoneFactorSelect(factor.id)}
                  >
                    {t("TransientOtpSelection.textMe")}
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
              title={t("TransientOtpSelection.voiceCall") ?? ""}
            />
            <GcdsContainer style={factorListStyle}>
              <GcdsText marginBottom="0">
                {t("TransientOtpSelection.codeExpiresIn")}{" "}
                <strong>{t("TransientOtpSelection.tenMinutes")}</strong>{" "}
                {t("TransientOtpSelection.carrierCharges")}
              </GcdsText>
              {voiceFactors.map((factor) => (
                <GcdsGrid
                  key={factor.id}
                  columns="1fr auto"
                  align-items="center"
                  style={factorRowStyle}
                >
                  <GcdsText marginBottom="0">
                    {getMaskedPhoneDestination(factor.destination)}
                  </GcdsText>
                  <GcdsLink
                    size="regular"
                    role="button"
                    aria-label={t("TransientOtpSelection.callMeEndingIn", {
                      digits: getLastFourDigits(factor.destination),
                    })}
                    onGcdsClick={() => handlePhoneFactorSelect(factor.id)}
                  >
                    {t("TransientOtpSelection.callMe")}
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
              title={t("TransientOtpSelection.passkeyOrSecurityKey") ?? ""}
              paddingBottom="0"
            />
            <GcdsContainer style={factorListStyle}>
              {fido2Data?.map((passkey) => (
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
                    aria-label={t("TransientOtpSelection.verifyWithPasskey", {
                      name: passkey.attributes?.nickname ?? passkey.id,
                    })}
                    onGcdsClick={() => onSelectFIDO2 && onSelectFIDO2(passkey)}
                  >
                    {t("TransientOtpSelection.verify")}
                  </GcdsLink>
                </GcdsGrid>
              ))}
            </GcdsContainer>
          </GcdsContainer>
        )}

        {/* Email section */}
        {emailAddress && onSelectEmail && (
          <GcdsContainer>
            <SectionHeader
              icon={<EmailIcon width="23" height="23" />}
              title={t("TransientOtpSelection.email") ?? ""}
            />
            <GcdsContainer style={factorListStyle}>
              <GcdsText marginBottom="0">
                {t("TransientOtpSelection.codeExpiresIn")}{" "}
                <strong>{t("TransientOtpSelection.tenMinutes")}</strong>
              </GcdsText>
              <GcdsGrid
                columns="1fr auto"
                align-items="center"
                style={factorRowStyle}
              >
                <GcdsText marginBottom="0">{emailAddress}</GcdsText>
                <GcdsLink
                  size="regular"
                  role="button"
                  onGcdsClick={() => onSelectEmail()}
                >
                  {t("TransientOtpSelection.emailMe")}
                </GcdsLink>
              </GcdsGrid>
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
          {t("Button.cancel", { ns: "common" })}
        </GcdsButton>
      </GcdsContainer>

      <GcdsContainer>
        <GcdsHeading tag="h2" marginTop="600" marginBottom="300">
          {t("TransientOtpSelection.needHelp")}
        </GcdsHeading>
        <GcdsText>
          <GcdsLink
            href={gcHelpCentreLinks.twoStepVerification}
            target="_blank"
          >
            {t("TransientOtpSelection.helpLink")}
          </GcdsLink>
        </GcdsText>
      </GcdsContainer>
    </GcdsContainer>
  );
}
