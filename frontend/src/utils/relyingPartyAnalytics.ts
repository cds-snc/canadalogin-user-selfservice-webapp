import { DEFAULT_RP_NAME } from "./constants";
import type { RelyingPartyInfo } from "../types/user";
import type { GA4EventParams } from "../types/utils";

export function getAnalyticsRelyingPartyParams(
  relyingPartyInfo?: RelyingPartyInfo | null,
): GA4EventParams {
  return {
    rp_name:
      relyingPartyInfo?.localized?.en?.name ??
      relyingPartyInfo?.linkName ??
      DEFAULT_RP_NAME,
    ...(relyingPartyInfo?.id && { rp_client_id: relyingPartyInfo.id }),
  };
}
