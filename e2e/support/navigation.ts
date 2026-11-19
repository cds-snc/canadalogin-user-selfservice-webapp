import type { Page, Response } from "@playwright/test";

/**
 * Navigates and waits for the page's IDV claims request to settle, so assertions that
 * something is *absent* can't pass before the data has loaded.
 */
export async function gotoAndWaitForClaims(
  page: Page,
  url: string,
): Promise<Response> {
  const claimsResponse = waitForClaimsResponse(page);
  await page.goto(url);
  return claimsResponse;
}

export function waitForClaimsResponse(page: Page): Promise<Response> {
  return page.waitForResponse(
    (res) =>
      res.url().includes("/v1/identity-verification/claims") &&
      res.request().method() === "GET",
  );
}
