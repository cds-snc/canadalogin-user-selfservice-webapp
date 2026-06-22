import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsRadios,
  GcdsText,
  GcdsContainer,
} from "@gcds-core/components-react";

import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { path } from "../../utils/routeHelpers";

const START_IDENTITY_OPTION = {
  online: "online",
  inPerson: "inPerson",
  cantProveNow: "cantProveNow",
} as const;

type StartIdentityOption =
  (typeof START_IDENTITY_OPTION)[keyof typeof START_IDENTITY_OPTION];

interface RadioOption {
  label: string;
  id: string;
  value: string;
  hint: string;
  checked: boolean;
}

export default function StartIdentityProofingPage() {
  const navigate = useNavigate();
  const { language } = useParams();

  const { t } = useTranslation("idv");
  const { t: tLayout } = useTranslation("layout");
  const [selectedOption, setSelectedOption] = useState<StartIdentityOption>();
  const onlineVerificationInfoPage = path(PAGES.idvOnlineVerificationInfoPage, {
    language,
  });
  const visitCanadaPostPage = path(PAGES.idvVisitCanadaPostPage, {
    language,
  });
  // placeholder for now, since no in-person main page exists
  const handleContinue = () => {
    switch (selectedOption) {
      case START_IDENTITY_OPTION.online:
        navigate(onlineVerificationInfoPage);
        break;
      case START_IDENTITY_OPTION.inPerson:
        navigate(visitCanadaPostPage);
        break;
      case START_IDENTITY_OPTION.cantProveNow:
      default:
        break;
    }
  };

  const radioOptions: RadioOption[] = [
    {
      label: t("StartIdentityProofing.onlineInstantOption"),
      id: `radio-${START_IDENTITY_OPTION.online}`,
      value: START_IDENTITY_OPTION.online,
      hint: t("StartIdentityProofing.onlineInstantHint"),
      checked: selectedOption === START_IDENTITY_OPTION.online,
    },
    {
      label: t("StartIdentityProofing.inPersonSignBackInOption"),
      id: `radio-${START_IDENTITY_OPTION.inPerson}`,
      value: START_IDENTITY_OPTION.inPerson,
      hint: t("StartIdentityProofing.inPersonSignBackInHint"),
      checked: selectedOption === START_IDENTITY_OPTION.inPerson,
    },
    {
      label: t("StartIdentityProofing.cantProveNowOption"),
      id: `radio-${START_IDENTITY_OPTION.cantProveNow}`,
      value: START_IDENTITY_OPTION.cantProveNow,
      hint: t("StartIdentityProofing.cantProveNowHint"),
      checked: selectedOption === START_IDENTITY_OPTION.cantProveNow,
    },
  ];

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
          <GcdsRadios
            name="start-identity-proofing-method"
            legend={t("StartIdentityProofing.howToProveHeading")}
            hideLegend
            options={radioOptions}
            value={selectedOption ?? ""}
            onGcdsChange={(e: CustomEvent<string>) => {
              setSelectedOption(
                (e.target as HTMLInputElement).value as StartIdentityOption,
              );
            }}
          ></GcdsRadios>
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            type="button"
            disabled={!selectedOption}
            onGcdsClick={(ev) => {
              ev.preventDefault();
              handleContinue();
            }}
          >
            {t("ServiceCanadaCentre.continueButton")}
          </GcdsButton>
          <GcdsButton
            buttonRole="secondary"
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
