import path from "path";
import { AUTH_DIR, required } from "./env";

export type TestUser = {
  /** Used in test titles and the storage-state filename. */
  key: string;
  description: string;
  email: () => string;
  password: () => string;
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
  storageState: path.join(AUTH_DIR, `${key}.json`),
});

/**
 * Dedicated test accounts. The OIDC client used by the target environment must have
 * no access policy (no OTP/MFA), so these users can sign in with a password only.
 */
export const TEST_USERS = {
  /** "User A": has completed fake ID proofing (expected values are in auth.setup.ts). */
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
  /** Dedicated account for the provider journeys, which create in-person cases. */
  inPerson: user(
    "in-person-user",
    "E2E_IN_PERSON_USER",
    "dedicated account for in-person journeys",
  ),
} satisfies Record<string, TestUser>;
