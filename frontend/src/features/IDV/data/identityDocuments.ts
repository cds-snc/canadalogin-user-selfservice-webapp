import type {
  IdentityDocument,
  IdentityDocumentOption,
  IdentityDocumentType,
} from "../api/identityDocumentsApi";
import type { ApprovedDocumentValue } from "./approvedDocuments";

export const NO_IDS_VALUE = "noIds";

export type IdDetailsFormVariant = "passport" | "driverLicence" | "default";

type Language = "en" | "fr";

// Radio options (and their order) on the "Select your ID" page. The selected
// type is sent to the identity documents API on submit.
export const SELECTABLE_DOCUMENT_TYPES: IdentityDocumentType[] = [
  "PASSPORT",
  "DRIVERS_LICENCE",
  "PROVINCIAL_PHOTO_ID",
  "PROVINCIAL_HEALTH_CARD",
  "PERMANENT_RESIDENT_CARD",
  "INDIAN_STATUS_CARD",
  "COMBO_CARD",
];

const DOCUMENTS_WITH_HINT = new Set<IdentityDocumentType>([
  "PROVINCIAL_HEALTH_CARD",
  "COMBO_CARD",
]);

export const getLocalizedName = (
  item: Pick<IdentityDocument | IdentityDocumentOption, "name_en" | "name_fr">,
  language: Language,
): string => (language === "fr" ? item.name_fr : item.name_en);

export const getDocumentLabelKey = (key: IdentityDocumentType): string =>
  `CanadaPostSelectId.documents.${key}.label`;

export const getDocumentHintKey = (
  key: IdentityDocumentType,
): string | undefined =>
  DOCUMENTS_WITH_HINT.has(key)
    ? `CanadaPostSelectId.documents.${key}.hint`
    : undefined;

export const getIdDetailsFormVariant = (
  key: IdentityDocumentType,
): IdDetailsFormVariant => {
  if (key === "PASSPORT") {
    return "passport";
  }

  if (key === "DRIVERS_LICENCE") {
    return "driverLicence";
  }

  return "default";
};

export const isProvinceScopedDocument = (document: IdentityDocument): boolean =>
  document.options.length > 0 &&
  document.options.every((option) => option.option_type === "province");

export const sortOptionsByLabel = (
  options: IdentityDocumentOption[],
  language: Language,
): IdentityDocumentOption[] =>
  [...options].sort((a, b) =>
    getLocalizedName(a, language).localeCompare(
      getLocalizedName(b, language),
      language,
    ),
  );

const SIMPLE_ID_NAMES: Record<string, Record<Language, string>> = {
  PASSPORT: {
    en: "Passport",
    fr: "Passeport",
  },
  DRIVERS_LICENCE: {
    en: "Driver's Licence",
    fr: "Permis de conduire",
  },
  PROVINCIAL_PHOTO_ID: {
    en: "Photo ID or services card",
    fr: "Carte d'identité ou de service avec photo",
  },
  PROVINCIAL_HEALTH_CARD: {
    en: "Health card",
    fr: "Carte de santé",
  },
  PERMANENT_RESIDENT_CARD: {
    en: "Resident card",
    fr: "Carte de résident",
  },
  INDIAN_STATUS_CARD: {
    en: "Secure Certificate of Indian Status",
    fr: "Certificat sécurisé de statut d'Indien",
  },
  COMBO_CARD: {
    en: "Combination driver's licence/health cards",
    fr: "Combinaison permis de conduire/cartes de santé",
  },
};

const APPROVED_DOC_ID_NAMES: Record<string, Record<Language, string>> = {
  passport: SIMPLE_ID_NAMES.PASSPORT,
  driverLicence: SIMPLE_ID_NAMES.DRIVERS_LICENCE,
  photoIDServiceCard: SIMPLE_ID_NAMES.PROVINCIAL_PHOTO_ID,
  photoIDHealthCard: SIMPLE_ID_NAMES.PROVINCIAL_HEALTH_CARD,
  canadianPRCard: SIMPLE_ID_NAMES.PERMANENT_RESIDENT_CARD,
  indianStatus: SIMPLE_ID_NAMES.INDIAN_STATUS_CARD,
  COMBO_CARD: SIMPLE_ID_NAMES.COMBO_CARD,
  noIds: {
    en: "No IDs",
    fr: "Pas de documents",
  },
};

export const getSimpleIdName = (
  key: IdentityDocumentType,
  language: Language,
): string => SIMPLE_ID_NAMES[key]?.[language] || "";

export const getSimpleApprovedDocName = (
  key: ApprovedDocumentValue,
  language: Language,
): string => APPROVED_DOC_ID_NAMES[key]?.[language] || "";
