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
      await this.emailInput.fill(email);
      await this.emailContinueButton.click();
    }

    await expect(this.passwordInput).toBeVisible();
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
