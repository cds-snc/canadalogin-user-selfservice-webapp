export type ApprovedDocumentValue =
  | "driverLicence"
  | "photoIDHealthCard"
  | "photoIDServiceCard"
  | "passport"
  | "canadianPRCard"
  | "indianStatus"
  | "noIds";

export const APPROVED_DOCUMENT_VALUES: ApprovedDocumentValue[] = [
  "driverLicence",
  "photoIDHealthCard",
  "photoIDServiceCard",
  "passport",
  "canadianPRCard",
  "indianStatus",
  "noIds",
];

export const APPROVED_DOCUMENT_VALUES_WITHOUT_NO_IDS: ApprovedDocumentValue[] =
  APPROVED_DOCUMENT_VALUES.filter((doc) => doc !== "noIds");
