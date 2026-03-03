/**
 * Storybook interaction tests for DeleteFIDO2PasskeyPage
 *
 * Stories use MSW to stub all network calls and Playwright (Chromium) to drive
 * real browser interactions against the full rendered component tree.
 *
 * Covered flows:
 *  1. CompleteDeleteViaFIDO2Passkey – full happy path:
 *       password → OTP selection → click passkey → FIDO2 verify (mocked) →
 *       confirm → success page
 *
 *  2. OTPPathToConfirmationScreen – OTP path:
 *       password → OTP selection → select SMS factor → enter OTP →
 *       confirmation screen displayed (validates the OTP identity-check leg)
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
} from "../../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../../utils/functions.tsx";

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
 * Everything is inside waitFor so the browser retries until shadow DOM is ready.
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

    // Fill all gcds-input fields
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

    // Submit via the continue button
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
  // Fill the OTP input
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

  // Click the Continue button
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
 * Creates a minimal fake PublicKeyCredential for navigator.credentials.get().
 * The ArrayBuffer fields satisfy formatAssertionForServer() without requiring
 * a real authenticator.
 */
function createMockFIDO2Credential() {
  const encoder = new TextEncoder();
  return {
    id: "mock-fido2-credential-id",
    rawId: encoder.encode("mock-raw-id").buffer,
    type: "public-key",
    response: {
      clientDataJSON: encoder.encode(
        '{"type":"webauthn.get","challenge":"test"}',
      ).buffer,
      authenticatorData: encoder.encode("mock-authenticator-data").buffer,
      signature: encoder.encode("mock-signature").buffer,
      userHandle: null,
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
      // fetchUserFIDO2Credentials reads response.data.fido2, so the payload must
      // be { data: { fido2: [...] } } not { data: [...] }
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
      response: { success: true, data: { trxnId: "txn-123" } },
    },
    {
      type: "post",
      endpoint: SUBMIT_END_POINTS.transientOtpVerify,
      response: { success: true },
    },
    {
      type: "delete",
      endpoint: "/v1/fido2/registration",
      response: { success: true },
    },
  ];
}

const fido2AssertionEndpoints = [
  {
    type: "post",
    endpoint: "/v1/fido2/assertion/options",
    response: {
      success: true,
      data: {
        challenge: "dGVzdC1jaGFsbGVuZ2U",
        // allowCredentials IDs must be valid base64url so prepareAssertionOptions
        // can decode them without throwing (hyphens corrupt the atob call).
        // "dGVzdA" = base64url for "test" — a harmless valid value.
        allowCredentials: [{ id: "dGVzdA", type: "public-key" }],
        timeout: 60000,
        rpId: "localhost",
      },
    },
  },
];

// ─── Story metadata ────────────────────────────────────────────────────────

export default {
  title: "GC Sign In/Tests/Features/ManageFIDO2/Delete FIDO2 Passkey Page",
  component: TestTemplate,
  args: {
    page: PAGES.deleteFIDO2PasskeyPage,
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

// ─── Story 1: Complete delete via FIDO2 passkey ────────────────────────────
//
// Flow: password → OTP selection (shows passkey) → click passkey →
//       FIDO2 verification auto-completes (mocked) →
//       confirmation screen → "Yes, delete" → success page

export const CompleteDeleteViaFIDO2Passkey = (() => {
  const passkeyData = [
    {
      id: "passkey-1",
      attributes: {
        nickname: "Work Laptop",
        credentialId: "cred-id-1",
        status: "ACTIVE",
      },
    },
  ];

  const baseParams = buildTestCase.parameters(
    "",
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.profile },
    [...coreEndpoints(passkeyData), ...fido2AssertionEndpoints],
  );

  return {
    // Install the navigator.credentials mock BEFORE the component renders
    // so VerifyFIDO2Passkey's auto-triggered WebAuthn call resolves immediately.
    // We use Object.defineProperty to ensure the mock takes effect even though
    // CredentialsContainer.get is non-writable by default in Chromium.
    decorators: [
      // eslint-disable-next-line no-unused-vars
      (Story) => {
        const mockCredential = createMockFIDO2Credential();
        try {
          // Replace the entire credentials object so all three methods exist
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
          // Fallback: try patching the get method directly
          try {
            Object.defineProperty(window.navigator.credentials, "get", {
              value: async () => mockCredential,
              configurable: true,
              writable: true,
            });
            // eslint-disable-next-line no-unused-vars
          } catch (_e2) {
            // Last resort: direct assignment
            window.navigator.credentials.get = async () => mockCredential;
          }
        }
        return <Story />;
      },
    ],
    parameters: {
      ...baseParams,
      test: { dangerouslyIgnoreUnhandledErrors: true },
    },
    play: async ({ canvasElement, step }) => {
      const canvas = within(canvasElement);

      await step(
        "Submit password to advance past password verification",
        async () => {
          await submitPasswordStep(canvasElement);
        },
      );

      await step(
        "Verify OTP selection screen shows the passkey option",
        async () => {
          await waitFor(async () => {
            // Passkey nickname appears in GcdsText; the action link shows locale key
            // "20" = "Verify" (OtpSelection.jsx renders each passkey with a "Verify" link)
            const hasNickname =
              canvasElement.textContent.includes("Work Laptop");
            await expect(hasNickname).toBeTruthy();
            const verifyLink = Array.from(
              canvasElement.querySelectorAll("gcds-link"),
            ).find((link) => link.textContent.trim() === "Verify");
            await expect(verifyLink).toBeInTheDocument();
          });
        },
      );

      await step("Select the FIDO2 passkey to verify with", async () => {
        await waitFor(async () => {
          const verifyLink = Array.from(
            canvasElement.querySelectorAll("gcds-link"),
          ).find((link) => link.textContent.trim() === "Verify");
          await expect(verifyLink).toBeInTheDocument();
          dispatchGcdsClick(verifyLink);
        });
      });

      await step(
        "FIDO2 verification auto-completes (mocked) and advances to confirmation",
        async () => {
          await waitFor(async () => {
            await expect(
              canvas.getByText(
                /Are you sure you want to delete this passkey\?/i,
              ),
            ).toBeInTheDocument();
          });
        },
      );

      await step("Confirm deletion by clicking 'Yes, delete'", async () => {
        await waitFor(async () => {
          const yesDeleteButton = canvas.getByText(/Yes, delete/i);
          await expect(yesDeleteButton).toBeInTheDocument();
          dispatchGcdsClick(yesDeleteButton);
        });
      });

      await step("Verify success page is displayed", async () => {
        await waitFor(async () => {
          await expect(
            canvas.getByText(/Remove passkey from your device/i),
          ).toBeInTheDocument();
        });
      });
    },
  };
})();

// ─── Story 2: OTP path shows confirmation screen ──────────────────────────
//
// Flow: password → OTP selection → select SMS factor →
//       enter OTP code → confirmation screen displayed
//
// Note: this test validates the identity-verification leg of the flow.
// The actual deletion is not exercised here because selectedPasskey is only
// set when a passkey is chosen from OtpSelection (not when OTP is used).

export const OTPPathToConfirmationScreen = (() => {
  const baseParams = buildTestCase.parameters(
    "",
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.profile },
    coreEndpoints(),
  );

  return {
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

      await step("Verify delete confirmation screen is displayed", async () => {
        await waitFor(async () => {
          await expect(
            canvas.getByText(/Are you sure you want to delete this passkey\?/i),
          ).toBeInTheDocument();
        });
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
    "",
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
            // Should land directly on the OTP validation screen, NOT the selection screen
            const hasPhoneText =
              canvasElement.textContent.includes("Check your phone");
            await expect(hasPhoneText).toBeTruthy();

            // Confirm OTP selection screen is NOT shown (no "Text me" links)
            const factorLinks = canvasElement.querySelectorAll("gcds-link");
            const textMeLink = Array.from(factorLinks).find(
              (link) => link.textContent.trim() === "Text me",
            );
            // Use toBeFalsy() because find() returns undefined (not null) when
            // not found, and expect(undefined).not.toBeInTheDocument() throws
            await expect(textMeLink).toBeFalsy();
          });
        },
      );
    },
  };
})();
