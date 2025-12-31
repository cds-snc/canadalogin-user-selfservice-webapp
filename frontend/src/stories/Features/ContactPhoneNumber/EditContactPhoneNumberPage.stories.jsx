import { AVAILABLE_LANGUAGES, PAGES } from "../../../utils/constants.jsx";
import { Template } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Features/ContactPhoneNumber/EditContactPhoneNumberPage",
  component: Template,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "EditContactPhoneNumberPage container component for updating contact phone number. Manages the multi-step flow including phone number entry, OTP verification, and confirmation.",
      },
    },
  },
  args: {
    page: PAGES.editContactPhoneNumberPage,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    firstName: "John",
    lastName: "Doe",
  },
};

// Story: Default Flow Start
export const Default = Template.bind({});
Default.args = {};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default state of the contact phone number editing flow. Uses Template for proper routing context.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-contact-phone",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: OTP Verification Step
export const OtpVerificationStep = Template.bind({});
OtpVerificationStep.args = {};
OtpVerificationStep.parameters = {
  docs: {
    description: {
      story: "Contact phone number editing flow at the OTP verification step.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-contact-phone/verify-otp",
      query: {
        language: AVAILABLE_LANGUAGES.en,
        step: "verify-otp",
      },
    },
  },
  mockData: [
    {
      url: "/api/auth/user-profile",
      method: "GET",
      status: 200,
      response: {
        id: "test-user-123",
        userName: "testuser@example.com",
        firstName: "John",
        lastName: "Doe",
        email: "testuser@example.com",
      },
    },
  ],
};

// Story: Confirm Update Step
export const ConfirmUpdateStep = Template.bind({});
ConfirmUpdateStep.args = {};
ConfirmUpdateStep.parameters = {
  docs: {
    description: {
      story: "Contact phone number editing flow at the confirmation step.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-contact-phone/confirm-update",
      query: {
        language: AVAILABLE_LANGUAGES.en,
        step: "confirm-update",
      },
    },
  },
  mockData: [
    {
      url: "/api/auth/user-profile",
      method: "GET",
      status: 200,
      response: {
        id: "test-user-123",
        userName: "testuser@example.com",
        firstName: "John",
        lastName: "Doe",
        email: "testuser@example.com",
      },
    },
  ],
};

// Story: Success Step
export const SuccessStep = Template.bind({});
SuccessStep.args = {};
SuccessStep.parameters = {
  docs: {
    description: {
      story: "Contact phone number editing flow at the success step.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-contact-phone/success",
      query: {
        language: AVAILABLE_LANGUAGES.en,
        step: "success",
      },
    },
  },
  mockData: [
    {
      url: "/api/auth/user-profile",
      method: "GET",
      status: 200,
      response: {
        id: "test-user-123",
        userName: "testuser@example.com",
        firstName: "John",
        lastName: "Doe",
        email: "testuser@example.com",
      },
    },
  ],
};

// Story: French Language
export const French = Template.bind({});
French.args = {};
French.parameters = {
  docs: {
    description: {
      story:
        "Contact phone number editing flow displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/edit-contact-phone/enter-phone",
      query: {
        language: AVAILABLE_LANGUAGES.fr,
        step: "enter-phone",
      },
    },
  },
  mockData: [
    {
      url: "/api/auth/user-profile",
      method: "GET",
      status: 200,
      response: {
        id: "test-user-123",
        userName: "testuser@example.com",
        firstName: "Jean",
        lastName: "Dupont",
        email: "testuser@example.com",
      },
    },
  ],
};
