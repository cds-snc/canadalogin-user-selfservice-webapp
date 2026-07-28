import { useMemo } from "react";

import type { RelyingPartyInfo, UserState } from "../types/user";

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
    relyingPartyUrl: localizedDetail?.url ?? relyingPartyInfo?.url ?? "",
  };
}

export function useRelyingPartyInfo(
  userState: UserState | null | undefined,
  language: string,
): RelyingPartyDetails {
  return useMemo(
    () => getRelyingPartyDetails(userState?.relyingPartyInfo, language),
    [userState?.relyingPartyInfo, language],
  );
}
