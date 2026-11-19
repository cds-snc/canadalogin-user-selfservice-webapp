import { expect, type Locator, type Page } from "@playwright/test";

/**
 * IBM Verify hosted sign-in page (GCS_Themes_SignIn in gc-signin-ibm-configuration).
 * The form is built from GCDS web components; Playwright CSS selectors pierce their
 * open shadow roots, so we target the native <input>/<button> inside each one.
 */
export class IbmVerifyLoginPage {
  private readonly signInChoiceButton: Locator;
  private readonly emailInput: Locator;
  private readonly emailContinueButton: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.signInChoiceButton = page.locator("#signInButton button");
    this.emailInput = page.locator("#user-name-input input");
    this.emailContinueButton = page.locator("#continueButton button");
    this.passwordInput = page.locator("#password-input input");
    this.submitButton = page.locator("#login-button button");
  }

  async login(email: string, password: string) {
    // The theme restores its last step from sessionStorage, and step 1 ("Sign in" vs
    // "Create account") isn't shown in every flow, so start from whichever step is visible.
    const currentStep = this.signInChoiceButton
      .or(this.emailInput)
      .or(this.passwordInput)
      .filter({ visible: true })
      .first();
    await expect(currentStep).toBeVisible({ timeout: 30_000 });

    if (await this.signInChoiceButton.isVisible()) {
      await this.signInChoiceButton.click();
    }
    if (await this.emailInput.isVisible()) {
      await fillWithoutLogging(this.emailInput, email);
      await this.emailContinueButton.click();
    }

    await expect(this.passwordInput).toBeVisible();
    await fillWithoutLogging(this.passwordInput, password);
    await this.submitButton.click();
  }
}

/**
 * `locator.fill(value)` puts the value in the step title (e.g. `Fill "<password>"`),
 * which ends up in HTML reports and CI artifacts. Setting the value via `evaluate`
 * keeps credentials out of them; the input/change events let the GCDS component
 * pick up the value exactly as it does for typed input.
 */
async function fillWithoutLogging(input: Locator, value: string) {
  await input.focus();
  await input.evaluate((element, text) => {
    const field = element as HTMLInputElement;
    field.value = text;
    field.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    field.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }, value);
}
