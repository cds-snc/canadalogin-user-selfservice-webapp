import path from "path";
import { AUTH_DIR, required } from "./env";

/** Text shown in the "Identity details" card on the English profile page. */
export type IdentityDetails = {
  /** Date in the badge, without the "Verified on" prefix. */
  verifiedOn: string;
  legalName: string;
  /** Omit when the card should not show the row. */
  dateOfBirth?: string;
  sourceOfInformation?: string;
};

export type TestUser = {
  /** Used in test titles and the storage-state filename. */
  key: string;
  description: string;
  email: () => string;
  password: () => string;
  storageState: string;
  /** Expected Identity details card, or undefined if the card must not be shown. */
  identityDetails?: IdentityDetails;
};

const user = (
  key: string,
  envPrefix: string,
  description: string,
  identityDetails?: IdentityDetails,
): TestUser => ({
  key,
  description,
  email: () => required(`${envPrefix}_EMAIL`),
  password: () => required(`${envPrefix}_PASSWORD`),
  storageState: path.join(AUTH_DIR, `${key}.json`),
  identityDetails,
});

/**
 * Dedicated test accounts. The OIDC client used by the target environment must have
 * no access policy (no OTP/MFA), so these users can sign in with a password only.
 */
export const TEST_USERS = {
  /** "User A": has completed fake ID proofing. */
  proven: user(
    "proven-user",
    "E2E_PROVEN_USER",
    "has completed fake ID proofing",
    // Fake ID proofing data for this account. If it completes ID proofing again,
    // update verifiedOn to the new date.
    {
      verifiedOn: "November 19, 2026",
      legalName: "FAKEFIRST FAKELAST",
      dateOfBirth: "December 2, 1995",
      sourceOfInformation: "Driver's Licence (Quebec)",
    },
  ),
  /** "User B": has no ID proofing data. */
  unproven: user(
    "unproven-user",
    "E2E_UNPROVEN_USER",
    "has no ID proofing data",
  ),
} satisfies Record<string, TestUser>;
