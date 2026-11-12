import { GcdsDateInput, GcdsInput } from "@gcds-core/components-react";
import type { ReactNode } from "react";

import type {
  CanadaPostIdDetailsErrorCodes,
  CanadaPostIdDetailsFormData,
} from "./validation/CanadaPostIdDetails.validation";

const FIELD_IDS: Record<keyof CanadaPostIdDetailsErrorCodes, string> = {
  idExpiryDate: "id-expiry-date-input",
  documentOptionId: "select-document-option",
  country: "select-country",
  province: "select-province",
  firstName: "first-name-input",
  lastName: "last-name-input",
  dateOfBirth: "date-of-birth-input",
  address: "address-input",
  cityTown: "city-town-input",
  postalCode: "postal-code-input",
};

type IdentityApplicantFieldsLabels = {
  idExpiry: string;
  idExpiryHint: string;
  firstName: string;
  firstNameHint: string;
  lastName: string;
  lastNameHint: string;
  dateOfBirth: string;
  address: string;
  addressHint: string;
  cityTown: string;
  postalCode: string;
  postalCodeHint: string;
};

type IdentityApplicantFieldsProps = {
  formData: CanadaPostIdDetailsFormData;
  currentLanguage: "en" | "fr";
  labels: IdentityApplicantFieldsLabels;
  fieldError: (field: keyof CanadaPostIdDetailsErrorCodes) => string;
  dateOfBirthError: string;
  showIdExpiry?: boolean;
  showAddressFields?: boolean;
  requireAddressFields?: boolean;
  updateField: (
    field: keyof CanadaPostIdDetailsFormData,
  ) => (event: CustomEvent) => void;
  provinceField?: ReactNode;
  children?: ReactNode;
};

export default function IdentityApplicantFields({
  formData,
  currentLanguage,
  labels,
  fieldError,
  dateOfBirthError,
  showIdExpiry = true,
  showAddressFields = true,
  requireAddressFields = true,
  updateField,
  provinceField,
  children,
}: IdentityApplicantFieldsProps) {
  return (
    <>
      {showIdExpiry ? (
        <GcdsDateInput
          id={FIELD_IDS.idExpiryDate}
          name={FIELD_IDS.idExpiryDate}
          legend={labels.idExpiry}
          hint={labels.idExpiryHint}
          format="full"
          lang={currentLanguage}
          value={formData.idExpiryDate}
          required
          errorMessage={fieldError("idExpiryDate")}
          onGcdsChange={updateField("idExpiryDate")}
        />
      ) : null}
      {children}
      <GcdsInput
        id={FIELD_IDS.firstName}
        inputId={FIELD_IDS.firstName}
        name={FIELD_IDS.firstName}
        lang={currentLanguage}
        label={labels.firstName}
        hint={labels.firstNameHint}
        value={formData.firstName}
        required
        errorMessage={fieldError("firstName")}
        onGcdsChange={updateField("firstName")}
      />
      <GcdsInput
        id={FIELD_IDS.lastName}
        inputId={FIELD_IDS.lastName}
        name={FIELD_IDS.lastName}
        lang={currentLanguage}
        label={labels.lastName}
        hint={labels.lastNameHint}
        value={formData.lastName}
        required
        errorMessage={fieldError("lastName")}
        onGcdsChange={updateField("lastName")}
      />
      <GcdsDateInput
        id={FIELD_IDS.dateOfBirth}
        name={FIELD_IDS.dateOfBirth}
        legend={labels.dateOfBirth}
        format="full"
        lang={currentLanguage}
        value={formData.dateOfBirth}
        required
        errorMessage={dateOfBirthError}
        onGcdsChange={updateField("dateOfBirth")}
      />
      {showAddressFields ? (
        <>
          <GcdsInput
            id={FIELD_IDS.address}
            inputId={FIELD_IDS.address}
            name={FIELD_IDS.address}
            lang={currentLanguage}
            label={labels.address}
            hint={labels.addressHint}
            value={formData.address}
            required={requireAddressFields}
            errorMessage={requireAddressFields ? fieldError("address") : ""}
            onGcdsChange={updateField("address")}
          />
          <GcdsInput
            id={FIELD_IDS.cityTown}
            inputId={FIELD_IDS.cityTown}
            name={FIELD_IDS.cityTown}
            lang={currentLanguage}
            label={labels.cityTown}
            value={formData.cityTown}
            required={requireAddressFields}
            errorMessage={requireAddressFields ? fieldError("cityTown") : ""}
            onGcdsChange={updateField("cityTown")}
          />
          {provinceField}
          <GcdsInput
            id={FIELD_IDS.postalCode}
            inputId={FIELD_IDS.postalCode}
            name={FIELD_IDS.postalCode}
            lang={currentLanguage}
            label={labels.postalCode}
            hint={labels.postalCodeHint}
            value={formData.postalCode}
            autocomplete="postal-code"
            required={requireAddressFields}
            errorMessage={requireAddressFields ? fieldError("postalCode") : ""}
            onGcdsChange={updateField("postalCode")}
          />
        </>
      ) : null}
    </>
  );
}
