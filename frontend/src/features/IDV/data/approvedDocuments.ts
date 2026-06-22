import { AVAILABLE_LANGUAGES } from "../../../utils/constants";

export const APPROVED_DOCUMENTS = [
  {
    value: "driverLicence",
    labels: {
      [AVAILABLE_LANGUAGES.en]: "Provincial/Territorial Driver's Licence",
      [AVAILABLE_LANGUAGES.fr]: "Permis de conduire provincial/territorial",
    },
  },
  {
    value: "photoIDHealthCard",
    labels: {
      [AVAILABLE_LANGUAGES.en]: "Provincial/Territorial Photo ID Health Card",
      [AVAILABLE_LANGUAGES.fr]: "Carte d'assurance-maladie avec photo provincial/territorial",
    },
  },
  {
    value: "photoIDServiceCard",
    labels: {
      [AVAILABLE_LANGUAGES.en]: "Provincial/Territorial Photo ID Service Card",
      [AVAILABLE_LANGUAGES.fr]: "Carte de service avec photo provincial/territorial",
    },
  },
  {
    value: "passport",
    labels: {
      [AVAILABLE_LANGUAGES.en]: "Canadian and International Passport",
      [AVAILABLE_LANGUAGES.fr]: "Passeport canadien et international",
    },
  },
  {
    value: "canadianPRCard",
    labels: {
      [AVAILABLE_LANGUAGES.en]: "Canadian PR Card",
      [AVAILABLE_LANGUAGES.fr]: "Carte de résidence permanente canadienne",
    },
  },
  {
    value: "indianStatus",
    labels: {
      [AVAILABLE_LANGUAGES.en]: "Secure Certificate of Indian Status",
      [AVAILABLE_LANGUAGES.fr]: "Certificat de statut d'Indien sécurisé",
    },
  },
  {
    value: "noIds",
    labels: {
      [AVAILABLE_LANGUAGES.en]: "I don't have any of these IDs",
      [AVAILABLE_LANGUAGES.fr]: "Je n'ai aucune de ces pièces d'identité",
    },
  },
] as const;

export const APPROVED_DOCUMENTS_WITHOUT_NO_IDS = APPROVED_DOCUMENTS.filter(
  (doc) => doc.value !== "noIds",
);
