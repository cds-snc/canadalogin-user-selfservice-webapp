import { expect, within, waitFor } from "@storybook/test";
import OtpSelection from "../../../../features/TransientOtp/components/OtpSelection.jsx";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../../utils/constants";

export default {
  title: "GC Sign In/Tests/Features/TransientOtp/OtpSelection",
  component: OtpSelection,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onNext: { action: "next clicked" },
    onCancel: { action: "cancel clicked" },
    onChangeUserSelectedMfaFactor: { action: "mfa factor changed" },
  },
};

const Template = (args) => <OtpSelection {...args} />;

// Mock user phone factors for testing
const multipleFactors = [
  {
    id: "factor-1",
    type: FLOW_TYPES.sms,
    destination: "+15551234567",
    status: "active",
  },
  {
    id: "factor-2",
    type: FLOW_TYPES.voice,
    destination: "+15559876543",
    status: "active",
  },
];

const singleSMSFactor = [
  {
    id: "factor-1",
    type: FLOW_TYPES.sms,
    destination: "+15551234567",
    status: "active",
  },
];

// Test: Multiple Factors with Radio Buttons
export const MultipleFactorsRadioButtons = Template.bind({});
MultipleFactorsRadioButtons.args = {
  userPhoneFactors: multipleFactors,
  userSelectedMfaFactor: multipleFactors[0],
  parentPage: PAGES.addMFAPage,
};
MultipleFactorsRadioButtons.parameters = {
  docs: {
    description: {
      story:
        "Tests OtpSelection component with multiple factors displaying as radio buttons",
    },
  },
};
MultipleFactorsRadioButtons.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // No more radio buttons — each factor is a row with a gcds-link select button
  await waitFor(async () => {
    const gcdsRadios = canvasElement.querySelector("gcds-radios");
    await expect(gcdsRadios).not.toBeInTheDocument();
  });

  // Verify factor rows are rendered as gcds-link elements
  await waitFor(async () => {
    const selectLinks = canvasElement.querySelectorAll("gcds-link");
    // At least 2 select-factor links (one per phone factor) plus help links
    await expect(selectLinks.length).toBeGreaterThanOrEqual(2);
  });

  // Only a cancel button exists (no continue/submit button)
  await waitFor(async () => {
    const cancelButton = canvas.getByText(/cancel/i);
    await expect(cancelButton).toBeInTheDocument();
  });
};

// Test: Single Factor (No Radio Buttons)
export const SingleFactorNoRadios = Template.bind({});
SingleFactorNoRadios.args = {
  userPhoneFactors: singleSMSFactor,
  userSelectedMfaFactor: singleSMSFactor[0],
  parentPage: PAGES.addMFAPage,
};
SingleFactorNoRadios.parameters = {
  docs: {
    description: {
      story:
        "Tests OtpSelection component with single factor (no radio buttons displayed)",
    },
  },
};
SingleFactorNoRadios.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // No radio buttons in new design
  await waitFor(async () => {
    const gcdsRadios = canvasElement.querySelector("gcds-radios");
    await expect(gcdsRadios).not.toBeInTheDocument();
  });

  // The factor destination should appear as text in the row
  await waitFor(async () => {
    const destination = canvas.getByText("******-4567");
    await expect(destination).toBeInTheDocument();
  });

  // A gcds-link select button is rendered for the factor
  await waitFor(async () => {
    const selectLinks = canvasElement.querySelectorAll("gcds-link");
    await expect(selectLinks.length).toBeGreaterThanOrEqual(1);
  });

  // Only a cancel button (no continue/submit button)
  await waitFor(async () => {
    const cancelButton = canvas.getByText(/cancel/i);
    await expect(cancelButton).toBeInTheDocument();
  });
};

// Test: Delete MFA Context
export const DeleteMFAContext = Template.bind({});
DeleteMFAContext.args = {
  userPhoneFactors: multipleFactors,
  userSelectedMfaFactor: multipleFactors[1],
  parentPage: PAGES.deleteMFAPage,
};
DeleteMFAContext.parameters = {
  docs: {
    description: {
      story: "Tests OtpSelection component in delete MFA context",
    },
  },
  a11y: {
    config: {
      rules: [
        {
          id: "label",
          enabled: false,
        },
      ],
    },
  },
};
DeleteMFAContext.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // No radio buttons in new design
  await waitFor(async () => {
    const gcdsRadios = canvasElement.querySelector("gcds-radios");
    await expect(gcdsRadios).not.toBeInTheDocument();
  });

  // Factor rows rendered as gcds-link elements
  await waitFor(async () => {
    const selectLinks = canvasElement.querySelectorAll("gcds-link");
    await expect(selectLinks.length).toBeGreaterThanOrEqual(2);
  });

  // Verify cancel button is present
  await waitFor(async () => {
    const cancelButton = canvas.getByText(/cancel/i);
    await expect(cancelButton).toBeInTheDocument();
  });
};
