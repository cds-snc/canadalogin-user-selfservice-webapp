import { JSX } from "react";
import { GcdsRadios } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { START_IDENTITY_OPTION, type StartIdentityOption } from "./methods";

interface RadioOption {
  label: string;
  id: string;
  value: string;
  hint: string;
  checked: boolean;
}

interface IdentityProofingRadioButtonsProps {
  selectedOption: StartIdentityOption | undefined;
  onOptionChange: (option: StartIdentityOption) => void;
  rpName?: string;
}

export default function IdentityProofingRadioButtons({
  selectedOption,
  onOptionChange,
  rpName,
}: IdentityProofingRadioButtonsProps): JSX.Element {
  const { t } = useTranslation("idv");

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
      hint: t("StartIdentityProofing.cantProveNowHint", {
        rpName: rpName ?? t("RelyingParty.relyingPartyName"),
      }),
      checked: selectedOption === START_IDENTITY_OPTION.cantProveNow,
    },
  ];

  return (
    <GcdsRadios
      name="start-identity-proofing-method"
      legend={t("StartIdentityProofing.howToProveHeading")}
      hideLegend
      options={radioOptions}
      value={selectedOption ?? ""}
      onGcdsChange={(e: CustomEvent<string>) => {
        onOptionChange(
          (e.target as HTMLInputElement).value as StartIdentityOption,
        );
      }}
    ></GcdsRadios>
  );
}
