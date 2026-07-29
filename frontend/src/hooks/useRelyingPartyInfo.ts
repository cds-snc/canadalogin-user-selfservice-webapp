import { useMemo } from "react";
import { useTranslation } from "react-i18next";

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

export function useRelyingPartyInfo(): RelyingPartyDetails {
  const { state } = useUser();
  const { i18n } = useTranslation();

  return useMemo(
    () => getRelyingPartyDetails(state?.relyingPartyInfo, i18n.language),
    [state?.relyingPartyInfo, i18n.language],
  );
}
