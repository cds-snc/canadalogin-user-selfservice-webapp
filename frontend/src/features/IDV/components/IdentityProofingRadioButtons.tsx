import { JSX } from "react";
import { GcdsRadios } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { START_IDENTITY_OPTION, type StartIdentityOption } from "./methods";
import { useRelyingPartyInfo } from "../../../hooks/useRelyingPartyInfo";
import { IDV_JOURNEY_TYPE } from "../constants";

type IDVJourneyType = (typeof IDV_JOURNEY_TYPE)[keyof typeof IDV_JOURNEY_TYPE];

interface RadioOption {
  label: string;
  id: string;
  value: string;
  hint: string;
  checked: boolean;
}

interface IdentityProofingRadioButtonsProps {
  selectedOption: StartIdentityOption | undefined;
  journeyType: IDVJourneyType;
  onOptionChange: (option: StartIdentityOption) => void;
  rpName: string;
  errorMessage?: string;
  id?: string;
}

export default function IdentityProofingRadioButtons({
  selectedOption,
  journeyType,
  onOptionChange,
  errorMessage,
  id,
}: IdentityProofingRadioButtonsProps): JSX.Element {
  const { t } = useTranslation("idv");
  const { relyingPartyName: rpName } = useRelyingPartyInfo();

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
  ];
  if (journeyType === IDV_JOURNEY_TYPE.REQUIRED) {
    radioOptions.push({
      label: t("StartIdentityProofing.notReadyOption"),
      id: `radio-${START_IDENTITY_OPTION.cantProveNow}`,
      value: START_IDENTITY_OPTION.cantProveNow,
      hint: t("StartIdentityProofing.notReadyHint", { rpName }),
      checked: selectedOption === START_IDENTITY_OPTION.cantProveNow,
    });
  }

  return (
    <GcdsRadios
      id={id}
      name="start-identity-proofing-method"
      legend={t("StartIdentityProofing.howToProveHeading")}
      hideLegend
      options={radioOptions}
      value={selectedOption ?? ""}
      errorMessage={errorMessage}
      onGcdsChange={(e: CustomEvent<string>) => {
        onOptionChange(
          (e.target as HTMLInputElement).value as StartIdentityOption,
        );
      }}
    ></GcdsRadios>
  );
}
