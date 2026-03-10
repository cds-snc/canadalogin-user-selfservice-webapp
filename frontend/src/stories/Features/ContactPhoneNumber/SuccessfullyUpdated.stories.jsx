import SuccessfullyUpdated from "../../../features/ContactPhoneNumber/components/SuccessfullyUpdated.jsx";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants";

export default {
  title: "GC Sign In/Features/ContactPhoneNumber/SuccessfullyUpdated",
  component: SuccessfullyUpdated,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Success confirmation page displayed after a contact phone number has been successfully updated.",
      },
    },
  },
  argTypes: {
    onNext: { action: "next clicked" },
    onCancel: { action: "cancel clicked" },
  },
};

const Template = (args) => <SuccessfullyUpdated {...args} />;

// Mock phone form data
const mockPhoneFormData = {
  phoneNumber: "+15551234567",
  formattedPhoneNumber: "+1 555-123-4567",
  otpType: "sms",
  country: "ca",
};

// Story: Default Success State
export const Default = Template.bind({});
Default.args = {
  phoneFormData: mockPhoneFormData,
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default success page shown after contact phone number update completion. Displays the new phone number and next steps.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/phone-updated-success",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Without Phone Number
export const WithoutPhoneNumber = Template.bind({});
WithoutPhoneNumber.args = {
  phoneFormData: {},
};
WithoutPhoneNumber.parameters = {
  docs: {
    description: {
      story:
        "Success page when phone form data is missing or incomplete. Shows fallback content without specific phone number.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/phone-updated-success",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  phoneFormData: mockPhoneFormData,
};
French.parameters = {
  docs: {
    description: {
      story:
        "Phone number update success page displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/phone-updated-success",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
