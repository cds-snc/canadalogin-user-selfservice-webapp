import axios from "axios";
import config from "../../../config";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { ApiErrorLike } from "../../../types/utils";

axios.defaults.withCredentials = true;

export type IdentityDocumentType =
  | "DRIVERS_LICENCE"
  | "PASSPORT"
  | "PROVINCIAL_PHOTO_ID"
  | "PROVINCIAL_HEALTH_CARD"
  | "PERMANENT_RESIDENT_CARD"
  | "INDIAN_STATUS_CARD"
  | "COMBO_CARD";

export type IdentityDocumentOptionType = "country" | "province" | "value";

export type IdentityDocumentOption = {
  id: number;
  name_en: string;
  name_fr: string;
  option_type: IdentityDocumentOptionType;
  canada_post_id: string | null;
  country_code: string | null;
  province_code: string | null;
  requires_proof: boolean;
};

export type IdentityDocument = {
  key: IdentityDocumentType;
  name_en: string;
  name_fr: string;
  options: IdentityDocumentOption[];
};

type IdentityDocumentsApiResponse = {
  success: boolean;
  message: string;
  data?: IdentityDocument[] | null;
};

export const identityDocumentsApi = {
  /**
   * Retrieves the approved identity documents from idv-data-store (via the backend).
   */
  getIdentityDocuments: async (
    types?: IdentityDocumentType[],
  ): Promise<IdentityDocument[]> => {
    try {
      const params = new URLSearchParams();
      types?.forEach((type) => params.append("types", type));

      const response = await axios.get<IdentityDocumentsApiResponse>(
        `${config.apiUrl}/v1/identity-verification/identity-documents`,
        { params },
      );

      return response.data.data ?? [];
    } catch (error) {
      return handleApiError(error as ApiErrorLike);
    }
  },
};
