import { GcdsRadios } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { JSX } from "react";
import { IN_PERSON_METHOD, type InPersonMethod } from "./methods";
interface RadioOption {
  label: string;
  id: string;
  value: string;
  checked: boolean;
  hint: string;
}

interface InPersonRadioButtonsProps {
  selectedMethod: InPersonMethod | undefined;
  onMethodChange: (method: InPersonMethod) => void;
}

export default function InPersonRadioButtons({
  selectedMethod,
  onMethodChange,
}: InPersonRadioButtonsProps): JSX.Element {
  const { t } = useTranslation("idv");

  const radioOptions: RadioOption[] = [
    {
      label: t("StartIdentityProofing.canadaPostLocationsOption"),
      id: `radio-${IN_PERSON_METHOD.canadaPostLocations}`,
      value: IN_PERSON_METHOD.canadaPostLocations,
      checked: selectedMethod === IN_PERSON_METHOD.canadaPostLocations,
      hint: t("ProveIdentityInPerson.canadaPostDescription"),
    },
    {
      label: t("StartIdentityProofing.serviceCanadaLocationsOption"),
      id: `radio-${IN_PERSON_METHOD.serviceCanadaLocations}`,
      value: IN_PERSON_METHOD.serviceCanadaLocations,
      checked: selectedMethod === IN_PERSON_METHOD.serviceCanadaLocations,
      hint: t("ProveIdentityInPerson.serviceCanadaDescription"),
    },
  ];

  return (
    <GcdsRadios
      name="in-person-idv-method"
      legend={t("StartIdentityProofing.inPersonOption")} // legend is still required for accessibility even if we choose to hide it visually
      hideLegend
      options={radioOptions}
      value={selectedMethod ?? ""}
      style={
        // Custom styles to meet design requirements for in-person option
        {
          "--gcds-radio-label-font-desktop":
            '700 1.25rem/160% "Noto Sans", sans-serif',
          "--gcds-radio-label-font-mobile":
            '700 1.125rem/155% "Noto Sans", sans-serif',
        } as React.CSSProperties
      }
      onGcdsChange={(e: CustomEvent<string>) => {
        onMethodChange((e.target as HTMLInputElement).value as InPersonMethod);
      }}
    ></GcdsRadios>
  );
}
