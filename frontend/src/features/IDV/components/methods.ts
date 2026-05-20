export const IN_PERSON_METHOD = {
  canadaPostLocations: "canadaPostLocations",
  serviceCanadaLocations: "serviceCanadaLocations",
} as const;

export type InPersonMethod =
  (typeof IN_PERSON_METHOD)[keyof typeof IN_PERSON_METHOD];

export const ONLINE_IDV_METHOD = {
  documentScanning: "documentScanning",
  provincialPartner: "provincialPartner",
} as const;

export type IdvMethod =
  (typeof ONLINE_IDV_METHOD)[keyof typeof ONLINE_IDV_METHOD];
