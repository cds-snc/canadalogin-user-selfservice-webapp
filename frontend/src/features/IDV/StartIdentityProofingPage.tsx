import {
  GcdsButton,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
  GcdsContainer,
  GcdsRadios,
  GcdsNotice,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DEV_ONLY_FEATURE } from "../../utils/constants";
import { useState } from "react";
import { identityVerificationApi } from "./api/identityVerificationApi";

interface RadioOption {
  label: string;
  id: string;
  value: string;
  hint: string;
  checked: boolean;
}

const IDV_METHOD = {
  documentScanning: "documentScanning",
  provincialPartner: "provincialPartner",
} as const;

type IdvMethod = (typeof IDV_METHOD)[keyof typeof IDV_METHOD];

interface RadioButtonsProps {
  selectedMethod: IdvMethod | undefined;
  onMethodChange: (method: IdvMethod) => void;
}

const OnlineRadioButtons = ({
  selectedMethod,
  onMethodChange,
}: RadioButtonsProps) => {
  const { t } = useTranslation("idv");

  const radioOptions: RadioOption[] = [
    {
      label: t("StartIdentityProofing.documentScanningOption"),
      id: `radio-${IDV_METHOD.documentScanning}`,
      value: IDV_METHOD.documentScanning,
      hint: t("StartIdentityProofing.hintDocumentScanningOption"),
      checked: selectedMethod === IDV_METHOD.documentScanning,
    },
    {
      label: t("StartIdentityProofing.provincialPartnerOption"),
      id: `radio-${IDV_METHOD.provincialPartner}`,
      value: IDV_METHOD.provincialPartner,
      hint: t("StartIdentityProofing.hintProvincialPartnerOption"),
      checked: selectedMethod === IDV_METHOD.provincialPartner,
    },
  ];

  return (
    <GcdsRadios
      name="idv-method"
      legend={t("StartIdentityProofing.radioOnlineLabel")}
      options={radioOptions}
      onGcdsChange={(e: CustomEvent<string>) => {
        onMethodChange((e.target as HTMLInputElement).value as IdvMethod);
      }}
    ></GcdsRadios>
  );
};

export default function StartIdentityProofingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("idv");
  const { t: tLayout } = useTranslation("layout");
  const [selectedMethod, setSelectedMethod] = useState<IdvMethod>();

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1">
            {t("StartIdentityProofing.pageTitle")}
          </GcdsHeading>
          <GcdsText>
            {t("StartIdentityProofing.heading", {
              appName: tLayout("TopNavBar.appName"),
            })}
          </GcdsText>

          <GcdsLink href="#" external size="regular">
            {t("StartIdentityProofing.learnMoreDescription")}
          </GcdsLink>

          <GcdsHeading tag="h2" marginTop="300" characterLimit={false}>
            {t("StartIdentityProofing.howToProveHeading")}
          </GcdsHeading>
          <OnlineRadioButtons
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
          />

          <GcdsHeading tag="h4" marginTop="300" characterLimit={false}>
            {t("StartIdentityProofing.inPersonOption")}
          </GcdsHeading>
          <GcdsNotice noticeRole="info" noticeTitleTag="h2" noticeTitle=" ">
            <GcdsText>
              {t("StartIdentityProofing.signBackInNotice", {
                appName: tLayout("TopNavBar.appName"),
              })}
            </GcdsText>
          </GcdsNotice>
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            type="button"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              identityVerificationApi
                .getOnlineIdentityVerificationUrl()
                .then((response) => {
                  const { redirect_url } = (
                    response as { data: { redirect_url: string } }
                  ).data;
                  window.location.href = redirect_url;
                });
            }}
          >
            {t("ServiceCanadaCentre.continueButton")}
          </GcdsButton>
          <GcdsButton
            buttonRole="secondary"
            style={{ width: "fit-content" }}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              // back to Relying Party page? For now, navigate to account settings page
              navigate("/");
            }}
          >
            {t("Button.cancel", { ns: "common" })}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
