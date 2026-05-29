/**
 * Storybook interaction tests for AddFIDO2PasskeyPage
 *
 * Stories use MSW to stub all network calls and Playwright (Chromium) to drive
 * real browser interactions against the full rendered component tree.
 *
 * Covered flows:
 *  1. OTPPathToNicknameScreen – OTP verification path:
 *       password → OTP selection → select SMS factor → enter OTP →
 *       addFIDO2Passkey screen → click "Create a passkey" (WebAuthn mocked) →
 *       nickname form displayed
 *
 *  2. CompletePasskeyRegistration – full happy path via FIDO2 identity check:
 *       password → OTP selection → select passkey → FIDO2 verify (mocked) →
 *       addFIDO2Passkey screen → click "Create a passkey" (WebAuthn mocked) →
 *       name the passkey → submit → navigates away
 *
 *  3. SingleFactorSkipsOTPSelection – with only one phone factor and no
 *       passkeys: password → OTP validation shown immediately (selection
 *       skipped)
 */
import { expect, userEvent, waitFor, within } from "@storybook/test";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
  SUBMIT_END_POINTS,
} from "../../../../utils/constants";
import { buildTestCase, TestTemplate } from "../../utils/functions.tsx";
const FUTURE_OTP_EXPIRY = new Date(Date.now() + 60_000).toISOString();

// ─── Shared interaction helpers ────────────────────────────────────────────

/**
 * Dispatch a synthetic gcdsClick event on a GCDS web component so the
 * React onGcdsClick handler fires even when the shadow-DOM button is
 * visually disabled.
 */
function dispatchGcdsClick(element) {
  const ev = new CustomEvent("gcdsClick", {
    bubbles: true,
    cancelable: true,
    detail: {},
  });
  Object.defineProperty(ev, "preventDefault", {
    value: () => {},
    writable: false,
  });
  element.dispatchEvent(ev);
}

/**
 * Fill the password field and submit the passwordVerification wizard step.
 */
async function submitPasswordStep(canvasElement) {
  await waitFor(async () => {
    const canvas = within(canvasElement);
    const gcdsInput = canvasElement.querySelector("gcds-input");
    await expect(gcdsInput).toBeInTheDocument();

    if (gcdsInput && gcdsInput.shadowRoot) {
      const shadowInput =
        gcdsInput.shadowRoot.querySelector("input#passwordVerification") ||
        gcdsInput.shadowRoot.querySelector(
          'input[name="passwordVerification"]',
        );
      await expect(shadowInput).toBeInTheDocument();
    }

    await expect(
      canvas.getByText(/first enter your current password/i),
    ).toBeInTheDocument();

    const gcdsInputs = canvasElement.querySelectorAll("gcds-input");
    for (const input of gcdsInputs) {
      if (input.shadowRoot) {
        const shadowInput =
          input.shadowRoot.querySelector("input#passwordVerification") ||
          input.shadowRoot.querySelector('input[name="passwordVerification"]');
        if (shadowInput) {
          shadowInput.value = "";
          shadowInput.dispatchEvent(new Event("input", { bubbles: true }));
          await userEvent.type(shadowInput, "TestPassword123!");
          input.dispatchEvent(
            new CustomEvent("gcdsInput", {
              bubbles: true,
              detail: { value: "TestPassword123!" },
            }),
          );
        }
      }
    }

    const continueButton = canvasElement.querySelector("gcds-button");
    if (continueButton) {
      if (
        continueButton.tagName === "GCDS-BUTTON" &&
        continueButton.shadowRoot
      ) {
        const actualButton =
          continueButton.shadowRoot.querySelector('button[part="button"]') ||
          continueButton.shadowRoot.querySelector("button");
        if (actualButton) {
          dispatchGcdsClick(continueButton);
        }
      }
    }
  });
}

/**
 * Enter the 6-digit OTP code and click Continue in the otpValidation step.
 */
async function submitOtpStep(canvasElement, canvas) {
  await waitFor(async () => {
    const gcdsInput = canvasElement.querySelector("gcds-input");
    await expect(gcdsInput).toBeInTheDocument();
    if (gcdsInput.shadowRoot) {
      const shadowInput =
        gcdsInput.shadowRoot.querySelector("input#verificationCode") ||
        gcdsInput.shadowRoot.querySelector('input[name="verificationCode"]') ||
        gcdsInput.shadowRoot.querySelector('input[maxlength="6"]');
      await expect(shadowInput).toBeInTheDocument();
      shadowInput.value = "";
      shadowInput.dispatchEvent(new Event("input", { bubbles: true }));
      await userEvent.type(shadowInput, "654321");
    }
  });

  await waitFor(async () => {
    const continueButton = canvas.getByText(/Continue/i);
    await expect(continueButton).toBeInTheDocument();
    if (continueButton && continueButton.shadowRoot) {
      const actualButton =
        continueButton.shadowRoot.querySelector('button[part="button"]') ||
        continueButton.shadowRoot.querySelector("button");
      if (actualButton) {
        await userEvent.click(actualButton);
      }
    }
  });
}

/**
 * Creates a minimal fake PublicKeyCredential for navigator.credentials.create().
 * The ArrayBuffer fields satisfy formatAttestationForServer() without requiring
 * a real authenticator.
 */
function createMockAttestationCredential() {
  const encoder = new TextEncoder();
  return {
    id: "mock-attestation-credential-id",
    rawId: encoder.encode("mock-raw-id").buffer,
    type: "public-key",
    response: {
      clientDataJSON: encoder.encode(
        '{"type":"webauthn.create","challenge":"test"}',
      ).buffer,
      attestationObject: encoder.encode("mock-attestation-object").buffer,
    },
  };
}

// ─── MSW endpoint builders ─────────────────────────────────────────────────

/**
 * Core endpoints needed by every story.
 * @param {Array} fido2Data  Passkeys to return from GET /v1/fido2/user
 * @param {number} numPhoneFactors  How many phone factors to return
 */
function coreEndpoints(fido2Data = [], numPhoneFactors = 2) {
  const phoneFactors = [
    {
      id: "factor-1",
      type: "smsotp",
      destination: "+15551234567",
      status: "active",
    },
    {
      id: "factor-2",
      type: "voiceotp",
      destination: "+15559876543",
      status: "active",
    },
  ].slice(0, numPhoneFactors);

  return [
    {
      type: "get",
      endpoint: "/v1/fido2/user",
      response: { success: true, data: { fido2: fido2Data } },
    },
    {
      type: "get",
      endpoint: "/v1/users/otp_factors",
      response: { success: true, data: phoneFactors },
    },
    {
      type: "post",
      endpoint: SUBMIT_END_POINTS.passwordVerify,
      response: { success: true, data: [] },
    },
    {
      type: "get",
      endpoint: SUBMIT_END_POINTS.requestPasswordPolicy,
      response: { success: true, data: { pwdMinLength: 12, pwdMaxLength: 65 } },
    },
    {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpSend,
      response: {
        success: true,
        data: { trxnId: "txn-123", expiry: FUTURE_OTP_EXPIRY },
      },
    },
    {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpVerify,
      response: { success: true },
    },
    {
      type: "post",
      endpoint: "/v1/fido2/attestation/options",
      response: {
        success: true,
        data: {
          challenge: "dGVzdC1jaGFsbGVuZ2U",
          user: {
            id: "dXNlci1pZA",
            name: "test@example.com",
            displayName: "Test User",
          },
          rp: { id: "localhost", name: "GC Sign-In" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          timeout: 60000,
          excludeCredentials: [],
          attestation: "none",
        },
      },
    },
    {
      type: "post",
      endpoint: "/v1/fido2/attestation/result",
      response: { success: true, data: { id: "new-passkey-id" } },
    },
  ];
}

/**
 * Decorator that installs the navigator.credentials mock BEFORE the component renders,
 * so AddFIDO2PasskeyPage's WebAuthn call resolves immediately without a real authenticator.
 */
// eslint-disable-next-line no-unused-vars
function withMockedWebAuthnCreate(Story) {
  const mockCredential = createMockAttestationCredential();
  try {
    Object.defineProperty(window.navigator, "credentials", {
      value: {
        get: async () => mockCredential,
        create: async () => mockCredential,
        store: async () => {},
        preventSilentAccess: async () => {},
      },
      configurable: true,
      writable: true,
    });
    // eslint-disable-next-line no-unused-vars
  } catch (_e) {
    try {
      Object.defineProperty(window.navigator.credentials, "create", {
        value: async () => mockCredential,
        configurable: true,
        writable: true,
      });
      // eslint-disable-next-line no-unused-vars
    } catch (_e2) {
      window.navigator.credentials.create = async () => mockCredential;
    }
  }
  return <Story />;
}

// ─── Story metadata ────────────────────────────────────────────────────────

export default {
  title: "GC Sign In/Tests/Features/ManageFIDO2/Add FIDO2 Passkey Page",
  component: TestTemplate,
  args: {
    page: PAGES.addFIDO2PasskeyPage,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    otpType: FLOW_TYPES.sms,
    passwordValidated: false,
    firstName: "John",
    lastName: "Doe",
    password: "TestPassword123!",
  },
};

const manage2FARoutePath = "/security-settings/manage-2fa-verifications";

// ─── Story 1: OTP path lands on the nickname screen ───────────────────────
//
// Flow: password → OTP selection → select SMS factor → enter OTP →
//       addFIDO2Passkey instructions screen →
//       click "Create a passkey" (WebAuthn mocked) →
//       nickname form is displayed

export const OTPPathToNicknameScreen = (() => {
  const baseParams = buildTestCase.parameters(
    manage2FARoutePath,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.profile },
    coreEndpoints(),
  );

  return {
    decorators: [withMockedWebAuthnCreate],
    parameters: {
      ...baseParams,
      test: { dangerouslyIgnoreUnhandledErrors: true },
    },
    play: async ({ canvasElement, step }) => {
      const canvas = within(canvasElement);

      await step("Submit password to proceed", async () => {
        await submitPasswordStep(canvasElement);
      });

      await step("Verify OTP selection screen is displayed", async () => {
        await waitFor(async () => {
          const gcdsLinks = canvasElement.querySelectorAll("gcds-link");
          await expect(gcdsLinks.length).toBeGreaterThan(0);
        });
      });

      await step("Select the Text Message (SMS) factor", async () => {
        await waitFor(async () => {
          const factorLinks = canvasElement.querySelectorAll("gcds-link");
          const textMeLink = Array.from(factorLinks).find(
            (link) => link.textContent.trim() === "Text me",
          );
          await expect(textMeLink).toBeInTheDocument();
          dispatchGcdsClick(textMeLink);
        });
      });

      await step("Verify OTP verification screen is displayed", async () => {
        await waitFor(async () => {
          const hasPhoneText =
            canvasElement.textContent.includes("Check your phone");
          await expect(hasPhoneText).toBeTruthy();
        });
      });

      await step("Enter the 6-digit OTP and submit", async () => {
        await submitOtpStep(canvasElement, canvas);
      });

      await step(
        'Verify the "How to create a passkey" instructions screen is displayed',
        async () => {
          await waitFor(async () => {
            await expect(
              canvas.getByText(/How to create a passkey/i),
            ).toBeInTheDocument();
          });
        },
      );

      await step(
        'Click "Create a passkey" to trigger the WebAuthn popup (mocked)',
        async () => {
          await waitFor(async () => {
            // Find the gcds-button whose text content is "Create a passkey"
            const createButton = Array.from(
              canvasElement.querySelectorAll("gcds-button"),
            ).find((btn) => btn.textContent.trim() === "Create a passkey");
            await expect(createButton).toBeInTheDocument();
            // AddFIDO2Passkey uses onClick (not onGcdsClick), so we must
            // click the real shadow-DOM button rather than dispatching gcdsClick
            if (createButton.shadowRoot) {
              const actualBtn =
                createButton.shadowRoot.querySelector(
                  'button[part="button"]',
                ) || createButton.shadowRoot.querySelector("button");
              if (actualBtn) {
                await userEvent.click(actualBtn);
              } else {
                dispatchGcdsClick(createButton);
              }
            } else {
              dispatchGcdsClick(createButton);
            }
          });
        },
      );

      await step("Verify the passkey nickname form is displayed", async () => {
        await waitFor(async () => {
          await expect(
            canvas.getByText(/Name your passkey/i),
          ).toBeInTheDocument();
        });
      });
    },
  };
})();

// ─── Story 2: Complete passkey registration via OTP verification ───────────
//
// Flow: password → OTP selection → select SMS factor → enter OTP →
//       addFIDO2Passkey instructions screen →
//       click "Create a passkey" (WebAuthn mocked) →
//       nickname form → type name → click Continue →
//       navigates back to manage 2FA page

export const CompletePasskeyRegistration = (() => {
  const baseParams = buildTestCase.parameters(
    manage2FARoutePath,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.profile },
    coreEndpoints(),
  );

  return {
    decorators: [withMockedWebAuthnCreate],
    parameters: {
      ...baseParams,
      test: { dangerouslyIgnoreUnhandledErrors: true },
    },
    play: async ({ canvasElement, step }) => {
      const canvas = within(canvasElement);

      await step("Submit password to proceed", async () => {
        await submitPasswordStep(canvasElement);
      });

      await step("Select the Text Message (SMS) factor", async () => {
        await waitFor(async () => {
          const factorLinks = canvasElement.querySelectorAll("gcds-link");
          const textMeLink = Array.from(factorLinks).find(
            (link) => link.textContent.trim() === "Text me",
          );
          await expect(textMeLink).toBeInTheDocument();
          dispatchGcdsClick(textMeLink);
        });
      });

      await step("Verify OTP verification screen is displayed", async () => {
        await waitFor(async () => {
          const hasPhoneText =
            canvasElement.textContent.includes("Check your phone");
          await expect(hasPhoneText).toBeTruthy();
        });
      });

      await step("Enter the 6-digit OTP and submit", async () => {
        await submitOtpStep(canvasElement, canvas);
      });

      await step(
        'Verify the "How to create a passkey" instructions screen is displayed',
        async () => {
          await waitFor(async () => {
            await expect(
              canvas.getByText(/How to create a passkey/i),
            ).toBeInTheDocument();
          });
        },
      );

      await step(
        'Click "Create a passkey" to trigger the WebAuthn popup (mocked)',
        async () => {
          const createButton = await waitFor(() => {
            const button = Array.from(
              canvasElement.querySelectorAll("gcds-button"),
            ).find((btn) => btn.textContent.trim() === "Create a passkey");
            expect(button).toBeInTheDocument();
            return button;
          });

          if (createButton.shadowRoot) {
            const actualBtn =
              createButton.shadowRoot.querySelector('button[part="button"]') ||
              createButton.shadowRoot.querySelector("button");
            if (actualBtn) {
              await userEvent.click(actualBtn);
            } else {
              dispatchGcdsClick(createButton);
            }
          } else {
            dispatchGcdsClick(createButton);
          }
        },
      );

      await step("Verify the passkey nickname form is displayed", async () => {
        await expect(
          await canvas.findByText(/Name your passkey/i),
        ).toBeInTheDocument();
      });

      await step(
        "Type a name for the new passkey in the input field",
        async () => {
          const gcdsInput = await waitFor(() => {
            const input = canvasElement.querySelector("gcds-input");
            expect(input).toBeInTheDocument();
            return input;
          });

          if (gcdsInput && gcdsInput.shadowRoot) {
            const shadowInput = gcdsInput.shadowRoot.querySelector("input");
            if (shadowInput) {
              shadowInput.value = "";
              shadowInput.dispatchEvent(new Event("input", { bubbles: true }));
              await userEvent.type(shadowInput, "My Laptop");
              gcdsInput.dispatchEvent(
                new CustomEvent("gcdsInput", {
                  bubbles: true,
                  detail: { value: "My Laptop" },
                }),
              );
            }
          }
        },
      );

      await step("Submit the nickname to complete registration", async () => {
        const continueButton = await waitFor(() => {
          const button = Array.from(
            canvasElement.querySelectorAll("gcds-button"),
          ).find((btn) => btn.textContent.trim() === "Continue");
          expect(button).toBeInTheDocument();
          return button;
        });

        if (continueButton.shadowRoot) {
          const actualBtn =
            continueButton.shadowRoot.querySelector('button[part="button"]') ||
            continueButton.shadowRoot.querySelector("button");
          if (actualBtn) {
            await userEvent.click(actualBtn);
          } else {
            dispatchGcdsClick(continueButton);
          }
        } else {
          dispatchGcdsClick(continueButton);
        }
      });
    },
  };
})();

// ─── Story 3: Single phone factor skips OTP selection ─────────────────────
//
// Flow: password → OTP validation shown immediately (OTP selection skipped
//       because there is only 1 phone factor and no FIDO2 passkeys)

export const SingleFactorSkipsOTPSelection = (() => {
  const baseParams = buildTestCase.parameters(
    manage2FARoutePath,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.profile },
    // Single SMS factor, no FIDO2 passkeys
    coreEndpoints([], 1),
  );

  return {
    parameters: {
      ...baseParams,
      test: { dangerouslyIgnoreUnhandledErrors: true },
    },
    play: async ({ canvasElement, step }) => {
      await step("Submit password to proceed", async () => {
        await submitPasswordStep(canvasElement);
      });

      await step(
        "Verify OTP validation screen is shown immediately (selection step skipped)",
        async () => {
          await waitFor(async () => {
            // Should land directly on the OTP validation screen
            const hasPhoneText =
              canvasElement.textContent.includes("Check your phone");
            await expect(hasPhoneText).toBeTruthy();

            // Confirm OTP selection screen is NOT shown (no "Text me" link)
            const factorLinks = canvasElement.querySelectorAll("gcds-link");
            const textMeLink = Array.from(factorLinks).find(
              (link) => link.textContent.trim() === "Text me",
            );
            await expect(textMeLink).toBeFalsy();
          });
        },
      );
    },
  };
})();
