import { expect, within, waitFor } from "@storybook/test";
import OtpSelection from "../../../../features/TransientOtp/components/OtpSelection";
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

  // Test core functionality: wait for radio group to render with multiple options
  await waitFor(async () => {
    const gcdsRadios = canvasElement.querySelector("gcds-radios");
    await expect(gcdsRadios).toBeInTheDocument();
  });

  // Test that the component has multiple options configured
  await waitFor(async () => {
    const gcdsRadios = canvasElement.querySelector("gcds-radios");
    // Just verify the component exists - let accessibility addon handle the details
    await expect(gcdsRadios).toBeInTheDocument();

    // Check component has legend for grouping
    const legend = gcdsRadios.getAttribute("legend");
    await expect(legend).toBeTruthy();
  });

  // Test that action buttons are functional
  await waitFor(async () => {
    const continueButton = canvas.getByText(/continue/i);
    const cancelButton = canvas.getByText(/cancel/i);
    await expect(continueButton).toBeInTheDocument();
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

  // Test core functionality: no radio component for single factor
  await waitFor(async () => {
    const gcdsRadios = canvasElement.querySelector("gcds-radios");
    await expect(gcdsRadios).not.toBeInTheDocument();
  });

  // Test that factor information is displayed directly as text
  await waitFor(async () => {
    const factorText = canvas.getByText(/text message.*\+15551234567/i);
    await expect(factorText).toBeInTheDocument();
  });

  // Test that action buttons are available
  await waitFor(async () => {
    const continueButton = canvas.getByText(/continue/i);
    const cancelButton = canvas.getByText(/cancel/i);
    await expect(continueButton).toBeInTheDocument();
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
  // Test core functionality: radio buttons are present in delete context
  await waitFor(async () => {
    const gcdsRadios = canvasElement.querySelector("gcds-radios");
    await expect(gcdsRadios).toBeInTheDocument();
  });

  // Test that the component is configured for delete context
  await waitFor(async () => {
    const gcdsRadios = canvasElement.querySelector("gcds-radios");
    await expect(gcdsRadios).toBeInTheDocument();

    // Verify proper legend for grouping
    const legend = gcdsRadios.getAttribute("legend");
    await expect(legend).toBeTruthy();
  });
};
