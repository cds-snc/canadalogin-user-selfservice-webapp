import { expect, request, type APIRequestContext } from "@playwright/test";
import { env } from "./env";
import type { TestUser } from "./testUsers";

export type IdvStatus =
  | "not_started"
  | "pending"
  | "in_progress"
  | "verified"
  | "failed"
  | "cancelled";

export type IdvClaims = {
  status: IdvStatus;
  verified_claims?: {
    verification?: { time?: string | null };
    claims?: {
      given_name?: string | null;
      family_name?: string | null;
      birthdate?: string | null;
    };
  };
};

/**
 * Reads the signed-in user's IDV claims through the self-service backend.
 * Pass `page.request` (or `context.request`) so the session cookie is sent.
 */
export async function getIdvClaims(api: APIRequestContext): Promise<IdvClaims> {
  const response = await api.get(
    `${env.apiURL}/v1/identity-verification/claims`,
  );
  expect(
    response.ok(),
    `GET claims failed with HTTP ${response.status()}`,
  ).toBeTruthy();
  const body = (await response.json()) as { data: IdvClaims };
  return body.data;
}

async function getIdvAdminToken(api: APIRequestContext): Promise<string> {
  const response = await api.post(`${env.idvAdmin.idpURL()}/oauth2/token`, {
    form: {
      grant_type: "client_credentials",
      client_id: env.idvAdmin.clientId(),
      client_secret: env.idvAdmin.clientSecret(),
      scope: "idv:admin",
    },
  });
  expect(
    response.ok(),
    `IdP token request failed with HTTP ${response.status()}`,
  ).toBeTruthy();
  const { access_token } = (await response.json()) as { access_token: string };
  return access_token;
}

/**
 * Soft-deletes all IDV cases for the user in idv-data-store (admin-only endpoint),
 * returning them to the "not started" state.
 * Returns false (and does nothing) when admin credentials are not configured.
 */
export async function resetIdvData(user: TestUser): Promise<boolean> {
  if (!env.idvAdmin.isConfigured()) {
    return false;
  }

  const api = await request.newContext();
  try {
    const token = await getIdvAdminToken(api);
    const response = await api.delete(
      `${env.idvAdmin.dataStoreURL()}/v1/users/${encodeURIComponent(user.userId())}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(response.status(), `Resetting IDV data for ${user.key} failed`).toBe(
      202,
    );
    return true;
  } finally {
    await api.dispose();
  }
}
