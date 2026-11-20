import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsSelect,
  GcdsText,
} from "@gcds-core/components-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";

import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import type { CanadaPostIdDetailsLocationState } from "./CanadaPostIdDetailsPage";

const PROOF_OF_ADDRESS_OPTIONS = [
  "deliveryNotice",
  "municipalTaxNotice",
  "leaseMortgageOrPurchaseAgreement",
  "insurancePolicy",
  "vehicleOwnershipOrInsurance",
  "bankOrCreditCardStatement",
  "recentUtilityBill",
  "childTaxBenefitStatement",
  "incomeTaxAssessment",
  "governmentChequeOrStub",
  "employmentInsuranceStatement",
  "cppQppStatement",
  "workplaceSafetyOrInsuranceBenefits",
  "provincialDisabilityOrWorksBenefits",
  "attestationOfResidence",
  "privatePostOfficeBoxRentalAgreement",
  "oldAgeSecurityOrCppBenefits",
  "noneOfThese",
] as const;

export default function CanadaPostProofOfAddressPage() {
  const { t } = useTranslation("idv");
  const navigate = useNavigate();
  const location = useLocation();
  const { language, journeyType } = useParams();
  const locationState =
    location.state as CanadaPostIdDetailsLocationState | null;
  const selectedDocument = locationState?.document;
  const formData = locationState?.formData;
  const [selectedProof, setSelectedProof] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const currentLanguage = language === "fr" ? "fr" : "en";

  const proofOfAddressOptions = PROOF_OF_ADDRESS_OPTIONS.map((option) =>
    t(`CanadaPostProofOfAddress.options.${option}`),
  );

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1">
            {t("CanadaPostProofOfAddress.heading")}
          </GcdsHeading>
          <GcdsText>{t("CanadaPostProofOfAddress.intro")}</GcdsText>
          <GcdsSelect
            id="proof-of-address-select"
            selectId="proof-of-address-select"
            name="proof-of-address"
            label={t("CanadaPostProofOfAddress.selectLabel")}
            hint={t("CanadaPostProofOfAddress.selectHint")}
            lang={currentLanguage}
            value={selectedProof}
            defaultValue={t("CanadaPostProofOfAddress.selectDefaultValue")}
            required
            errorMessage={
              hasSubmitted && !selectedProof
                ? t("CanadaPostProofOfAddress.selectError")
                : ""
            }
            onGcdsChange={(event: CustomEvent) => {
              const target = event.target as HTMLSelectElement | null;
              setSelectedProof(target?.value ?? "");
            }}
          >
            {proofOfAddressOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </GcdsSelect>
        </GcdsContainer>

        <GcdsGrid
          columns="1"
          columnsDesktop="max-content max-content"
          gap="200"
        >
          <GcdsButton
            type="button"
            onGcdsClick={(event: Event) => {
              event.preventDefault();
              setHasSubmitted(true);
              if (!selectedProof) {
                return;
              }

              if (selectedDocument) {
                navigate(
                  path(PAGES.idvCanadaPostIdDetailsPage, {
                    language,
                    journeyType,
                  }),
                  {
                    state: {
                      document: selectedDocument,
                      formData,
                      proofOfAddressAcknowledged: true,
                      proofOfAddress: selectedProof,
                    },
                  },
                );
              }
            }}
          >
            {t("CanadaPostProofOfAddress.continueButton")}
          </GcdsButton>
          <GcdsButton
            type="button"
            buttonRole="secondary"
            onGcdsClick={(event: Event) => {
              event.preventDefault();
              navigate(-1);
            }}
          >
            {t("CanadaPostProofOfAddress.backButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
