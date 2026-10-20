import type {
  IdentityDocument,
  IdentityDocumentOption,
  IdentityDocumentType,
} from "../api/identityDocumentsApi";

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
  "PASSPORT",
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
