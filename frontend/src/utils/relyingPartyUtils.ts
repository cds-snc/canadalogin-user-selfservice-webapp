import type { RelyingPartyInfo } from "../types/user";

/**
 * Extracts the relying party name from relyingPartyInfo based on the user's language.
 * Falls back to linkName if localized name is not available.
 *
 * @param relyingPartyInfo - The relying party information object
 * @param language - The user's current language (e.g., 'en', 'fr')
 * @param fallback - Optional fallback value if no name is found
 * @returns The relying party name, or the fallback value if provided, or empty string
 */
export function getRelyingPartyName(
  relyingPartyInfo: RelyingPartyInfo | null | undefined,
  language: string,
  fallback?: string,
): string {
  const localizedDetail = relyingPartyInfo?.localized?.[language];
  const rpName =
    localizedDetail?.name ?? relyingPartyInfo?.linkName ?? fallback ?? "";
  return rpName;
}

/**
 * Extracts the relying party URL from relyingPartyInfo based on the user's language.
 * Falls back to the base URL if localized URL is not available.
 *
 * @param relyingPartyInfo - The relying party information object
 * @param language - The user's current language (e.g., 'en', 'fr')
 * @param fallback - Optional fallback value if no URL is found
 * @returns The relying party URL, or the fallback value if provided, or empty string
 */
export function getRelyingPartyUrl(
  relyingPartyInfo: RelyingPartyInfo | null | undefined,
  language: string,
  fallback?: string,
): string {
  const localizedDetail = relyingPartyInfo?.localized?.[language];
  const rpUrl = localizedDetail?.url ?? relyingPartyInfo?.url ?? fallback ?? "";
  return rpUrl;
}
