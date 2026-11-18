import path from "path";
import { AUTH_DIR, required } from "./env";

export type TestUser = {
  /** Used in test titles and the storage-state filename. */
  key: string;
  description: string;
  email: () => string;
  password: () => string;
  /** IBM Verify user id (sub); needed to reset the user's IDV data. */
  userId: () => string;
  storageState: string;
};

const user = (
  key: string,
  envPrefix: string,
  description: string,
): TestUser => ({
  key,
  description,
  email: () => required(`${envPrefix}_EMAIL`),
  password: () => required(`${envPrefix}_PASSWORD`),
  userId: () => required(`${envPrefix}_ID`),
  storageState: path.join(AUTH_DIR, `${key}.json`),
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
  ),
  /** "User B": has no ID proofing data. */
  unproven: user(
    "unproven-user",
    "E2E_UNPROVEN_USER",
    "has no ID proofing data",
  ),
} satisfies Record<string, TestUser>;
