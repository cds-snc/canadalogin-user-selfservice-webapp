import { expect, within } from "@storybook/test";
import { AVAILABLE_LANGUAGES, PAGES } from "../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../utils/functions.tsx";
import NoticeFactory from "../../../components/InfoBlocks/NoticeFactory.jsx";

export default {
  title: "GC Sign In/Tests/InfoBlocks/NoticeFactory",
  component: TestTemplate,
  args: {
    page: PAGES.successBanner,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
  },
};

// Test mfaDeleted notice with phone number
export const MfaDeletedWithPhoneNumber = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => (
    <NoticeFactory noticeType="mfaDeleted" phoneNumber="+1 (555) 123-4567" />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify notice renders", async () => {
      // Find the GCDS notice element
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();
    });

    await step("Verify phone number is displayed", async () => {
      // The phone number should be in a strong tag
      const phoneNumber = canvas.getByText("+1 (555) 123-4567");
      await expect(phoneNumber).toBeInTheDocument();
      await expect(phoneNumber.tagName.toLowerCase()).toBe("strong");
    });

    await step("Verify deletion message is present", async () => {
      // Check that key text content is present
      const gcdsNotice = canvasElement.querySelector("gcds-notice");

      // Try to access content from shadow DOM if available
      let textContent = gcdsNotice.textContent;
      if (gcdsNotice.shadowRoot) {
        const slotContent = gcdsNotice.shadowRoot.querySelector("slot");
        if (slotContent) {
          textContent = slotContent
            .assignedNodes()
            .map((node) => node.textContent)
            .join("");
        }
      }

      // Verify the message contains expected text
      await expect(textContent).toContain("verification");
    });
  },
};

// Test mfaDeleted notice without phone number
export const MfaDeletedWithoutPhoneNumber = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => <NoticeFactory noticeType="mfaDeleted" />,
  play: async ({ canvasElement, step }) => {
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify notice renders", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();
    });

    await step("Verify strong tag exists but is empty", async () => {
      const strongTag = canvasElement.querySelector("strong");
      await expect(strongTag).toBeInTheDocument();
      // The strong tag should be empty or contain empty text
      await expect(strongTag.textContent.trim()).toBe("");
    });

    await step("Verify notice structure", async () => {
      const gcdsText = canvasElement.querySelector("gcds-text");
      await expect(gcdsText).toBeInTheDocument();
    });
  },
};

// Test mfaAdded notice with SMS
export const MfaAddedWithSMS = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => (
    <NoticeFactory
      noticeType="mfaAdded"
      phoneNumber="+1 (555) 987-6543"
      otpType="sms"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify notice renders", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();
    });

    await step("Verify phone number is displayed", async () => {
      const phoneNumber = canvas.getByText("+1 (555) 987-6543");
      await expect(phoneNumber).toBeInTheDocument();
      await expect(phoneNumber.tagName.toLowerCase()).toBe("strong");
    });

    await step("Verify OTP type (sms) is mentioned", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      const textContent = gcdsNotice.textContent;

      // The otpType "sms" should appear in the text
      await expect(textContent).toContain("sms");
    });

    await step("Verify added message is present", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      const textContent = gcdsNotice.textContent;

      // Verify the message contains "added" text
      await expect(textContent).toContain("added");
    });
  },
};

// Test mfaAdded notice with Voice
export const MfaAddedWithVoice = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => (
    <NoticeFactory
      noticeType="mfaAdded"
      phoneNumber="+1 (555) 111-2222"
      otpType="voice"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify notice renders", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();
    });

    await step("Verify phone number is displayed", async () => {
      const phoneNumber = canvas.getByText("+1 (555) 111-2222");
      await expect(phoneNumber).toBeInTheDocument();
    });

    await step("Verify OTP type (voice) is mentioned", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      const textContent = gcdsNotice.textContent;

      // The otpType "voice" should appear in the text
      await expect(textContent).toContain("voice");
    });
  },
};

// Test mfaAdded notice without phone number
export const MfaAddedWithoutPhoneNumber = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => <NoticeFactory noticeType="mfaAdded" otpType="sms" />,
  play: async ({ canvasElement, step }) => {
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify notice renders", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();
    });

    await step("Verify strong tag exists but is empty", async () => {
      const strongTag = canvasElement.querySelector("strong");
      await expect(strongTag).toBeInTheDocument();
      await expect(strongTag.textContent.trim()).toBe("");
    });

    await step("Verify OTP type is still shown", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      const textContent = gcdsNotice.textContent;
      await expect(textContent).toContain("sms");
    });
  },
};

// Test mfaAdded notice without otpType
export const MfaAddedWithoutOtpType = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => (
    <NoticeFactory noticeType="mfaAdded" phoneNumber="+1 (555) 333-4444" />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify notice renders", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();
    });

    await step("Verify phone number is displayed", async () => {
      const phoneNumber = canvas.getByText("+1 (555) 333-4444");
      await expect(phoneNumber).toBeInTheDocument();
    });

    await step("Verify notice has proper structure", async () => {
      const gcdsText = canvasElement.querySelector("gcds-text");
      await expect(gcdsText).toBeInTheDocument();

      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();
    });
  },
};

// Test with French language
export const MfaDeletedFrench = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.fr,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => (
    <NoticeFactory noticeType="mfaDeleted" phoneNumber="+1 (555) 777-8888" />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify notice renders in French context", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();
    });

    await step("Verify phone number is displayed", async () => {
      const phoneNumber = canvas.getByText("+1 (555) 777-8888");
      await expect(phoneNumber).toBeInTheDocument();
    });

    await step("Verify notice structure is consistent", async () => {
      const gcdsText = canvasElement.querySelector("gcds-text");
      await expect(gcdsText).toBeInTheDocument();
    });
  },
};

// Test GCDS Notice attributes
export const VerifyGcdsNoticeAttributes = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => (
    <NoticeFactory noticeType="mfaDeleted" phoneNumber="+1 (555) 999-0000" />
  ),
  play: async ({ canvasElement, step }) => {
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify GcdsNotice renders", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();
    });

    await step("Verify nested GcdsText component", async () => {
      const gcdsText = canvasElement.querySelector("gcds-text");
      await expect(gcdsText).toBeInTheDocument();

      // There should be nested GcdsText components
      const allGcdsText = canvasElement.querySelectorAll("gcds-text");
      await expect(allGcdsText.length).toBeGreaterThanOrEqual(2);
    });

    await step("Verify strong tag for phone number", async () => {
      const strongTag = canvasElement.querySelector("strong");
      await expect(strongTag).toBeInTheDocument();
      await expect(strongTag.textContent).toBe("+1 (555) 999-0000");
    });
  },
};

// Test component structure for mfaAdded
export const VerifyMfaAddedStructure = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => (
    <NoticeFactory
      noticeType="mfaAdded"
      phoneNumber="+1 (555) 555-5555"
      otpType="sms"
    />
  ),
  play: async ({ canvasElement, step }) => {
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify component hierarchy", async () => {
      // Verify the outer GcdsText wrapper
      const outerGcdsText = canvasElement.querySelector("gcds-text");
      await expect(outerGcdsText).toBeInTheDocument();

      // Verify GcdsNotice is inside the outer GcdsText
      const gcdsNotice = outerGcdsText.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();

      // Verify inner GcdsText is inside the GcdsNotice
      const innerGcdsText = gcdsNotice.querySelector("gcds-text");
      await expect(innerGcdsText).toBeInTheDocument();
    });

    await step("Verify text content structure", async () => {
      const innerGcdsText = canvasElement.querySelector(
        "gcds-notice gcds-text",
      );

      // Check that it contains the phone number in a strong tag
      const strongTag = innerGcdsText.querySelector("strong");
      await expect(strongTag).toBeInTheDocument();
      await expect(strongTag.textContent).toBe("+1 (555) 555-5555");

      // Verify the inner GcdsText contains the OTP type
      await expect(innerGcdsText.textContent).toContain("sms");
    });
  },
};

// Test empty phone number behavior
export const EmptyPhoneNumberHandling = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => <NoticeFactory noticeType="mfaDeleted" phoneNumber="" />,
  play: async ({ canvasElement, step }) => {
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify component renders with empty phone number", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();
    });

    await step("Verify strong tag exists but is empty", async () => {
      const strongTag = canvasElement.querySelector("strong");
      await expect(strongTag).toBeInTheDocument();
      await expect(strongTag.textContent).toBe("");
    });
  },
};

// Test null phone number behavior
export const NullPhoneNumberHandling = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => (
    <NoticeFactory noticeType="mfaAdded" phoneNumber={null} otpType="voice" />
  ),
  play: async ({ canvasElement, step }) => {
    await new Promise((r) => setTimeout(r, 1000));

    await step("Verify component renders with null phone number", async () => {
      const gcdsNotice = canvasElement.querySelector("gcds-notice");
      await expect(gcdsNotice).toBeInTheDocument();
    });

    await step("Verify strong tag exists", async () => {
      const strongTag = canvasElement.querySelector("strong");
      await expect(strongTag).toBeInTheDocument();
    });
  },
};

// Test invalid noticeType returns null
export const InvalidNoticeType = {
  parameters: {
    ...buildTestCase.parameters(
      "",
      {
        language: AVAILABLE_LANGUAGES.en,
      },
      [],
    ),
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  render: () => (
    <NoticeFactory noticeType="invalidType" phoneNumber="+1 (555) 000-0000" />
  ),
  play: async ({ canvasElement, step }) => {
    await new Promise((r) => setTimeout(r, 1000));

    await step(
      "Verify component returns null for invalid noticeType",
      async () => {
        // The component should return null, so nothing should be rendered
        const gcdsNotice = canvasElement.querySelector("gcds-notice");
        await expect(gcdsNotice).not.toBeInTheDocument();

        const gcdsText = canvasElement.querySelector("gcds-text");
        await expect(gcdsText).not.toBeInTheDocument();
      },
    );
  },
};
