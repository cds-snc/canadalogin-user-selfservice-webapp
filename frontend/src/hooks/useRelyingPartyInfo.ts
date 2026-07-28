import { useMemo } from "react";

import { useUser } from "../components/Providers/useUser";
import type { RelyingPartyInfo } from "../types/user";

export type RelyingPartyDetails = {
  relyingPartyInfo: RelyingPartyInfo | null;
  hasRelyingParty: boolean;
  relyingPartyName: string;
  relyingPartyUrl: string;
};

function getRelyingPartyDetails(
  relyingPartyInfo: RelyingPartyInfo | null | undefined,
  language: string,
): RelyingPartyDetails {
  const localizedDetail = relyingPartyInfo?.localized?.[language];
  const relyingParty = relyingPartyInfo ?? null;

  return {
    relyingPartyInfo: relyingParty,
    hasRelyingParty: Boolean(relyingParty),
    relyingPartyName: localizedDetail?.name ?? relyingPartyInfo?.linkName ?? "",
    relyingPartyUrl: localizedDetail?.url ?? relyingPartyInfo?.url ?? "/",
  };
}

export function useRelyingPartyInfo(language: string): RelyingPartyDetails {
  const { state } = useUser();

  return useMemo(
    () => getRelyingPartyDetails(state?.relyingPartyInfo, language),
    [state?.relyingPartyInfo, language],
  );
}
