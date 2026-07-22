import { useMemo } from "react";

import type { RelyingPartyInfo, UserState } from "../types/user";

export type RelyingPartyDetails = {
  relyingPartyInfo: RelyingPartyInfo | null;
  relyingPartyName: string;
  relyingPartyUrl: string;
};

function getRelyingPartyDetails(
  relyingPartyInfo: RelyingPartyInfo | null | undefined,
  language: string,
  fallbackName: string,
): RelyingPartyDetails {
  const localizedDetail = relyingPartyInfo?.localized?.[language];

  return {
    relyingPartyInfo: relyingPartyInfo ?? null,
    relyingPartyName:
      localizedDetail?.name ?? relyingPartyInfo?.linkName ?? fallbackName,
    relyingPartyUrl: localizedDetail?.url ?? relyingPartyInfo?.url ?? "",
  };
}

export function useRelyingPartyInfo(
  userState: UserState | null | undefined,
  language: string,
  fallbackName: string,
): RelyingPartyDetails {
  return useMemo(
    () =>
      getRelyingPartyDetails(
        userState?.relyingPartyInfo,
        language,
        fallbackName,
      ),
    [userState?.relyingPartyInfo, language, fallbackName],
  );
}
