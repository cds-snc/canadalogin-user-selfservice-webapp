import { GcdsRadios } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { JSX } from "react";

interface RadioOption {
  label: string;
  id: string;
  value: string;
  hint: string;
  checked: boolean;
}

const ONLINE_IDV_METHOD = {
  documentScanning: "documentScanning",
  provincialPartner: "provincialPartner",
} as const;

export type IdvMethod =
  (typeof ONLINE_IDV_METHOD)[keyof typeof ONLINE_IDV_METHOD];

interface OnlineRadioButtonsProps {
  selectedMethod: IdvMethod | undefined;
  onMethodChange: (method: IdvMethod) => void;
}

export default function OnlineRadioButtons({
  selectedMethod,
  onMethodChange,
}: OnlineRadioButtonsProps): JSX.Element {
  const { t } = useTranslation("idv");

  const radioOptions: RadioOption[] = [
    {
      label: t("StartIdentityProofing.documentScanningOption"),
      id: `radio-${ONLINE_IDV_METHOD.documentScanning}`,
      value: ONLINE_IDV_METHOD.documentScanning,
      hint: t("StartIdentityProofing.hintDocumentScanningOption"),
      checked: selectedMethod === ONLINE_IDV_METHOD.documentScanning,
    },
    {
      label: t("StartIdentityProofing.provincialPartnerOption"),
      id: `radio-${ONLINE_IDV_METHOD.provincialPartner}`,
      value: ONLINE_IDV_METHOD.provincialPartner,
      hint: t("StartIdentityProofing.hintProvincialPartnerOption"),
      checked: selectedMethod === ONLINE_IDV_METHOD.provincialPartner,
    },
  ];

  return (
    <GcdsRadios
      name="online-idv-method"
      legend={t("StartIdentityProofing.radioOnlineLabel")}
      options={radioOptions}
      value={selectedMethod ?? ""}
      onGcdsChange={(e: CustomEvent<string>) => {
        onMethodChange((e.target as HTMLInputElement).value as IdvMethod);
      }}
    ></GcdsRadios>
  );
}
