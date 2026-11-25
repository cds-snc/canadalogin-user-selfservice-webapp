import {
  expect,
  type APIRequestContext,
  type Page,
  type Response,
} from "@playwright/test";
import { env } from "./env";

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
  source_display?: {
    documents?: Array<{
      display_name?: { en?: string | null; fr?: string | null };
    }>;
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
  await expect(
    response,
    "GET /v1/identity-verification/claims succeeds",
  ).toBeOK();
  const body = (await response.json()) as { data: IdvClaims };
  return body.data;
}

export function waitForInPersonCaseCreation(page: Page): Promise<Response> {
  return page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith(
        "/v1/identity-verification/in-person",
      ) && response.request().method() === "POST",
  );
}
