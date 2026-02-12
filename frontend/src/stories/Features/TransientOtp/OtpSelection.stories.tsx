import OtpSelection from "../../../features/TransientOtp/components/OtpSelection";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants";

export default {
  title: "GC Sign In/Features/TransientOtp/OtpSelection",
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

// Mock user phone factors for different scenarios
const singleSMSFactor = [
  {
    id: "factor-1",
    type: FLOW_TYPES.sms,
    phoneNumber: "+15551234567",
    status: "active",
  },
];

const singleVoiceFactor = [
  {
    id: "factor-2",
    type: FLOW_TYPES.voice,
    phoneNumber: "+15559876543",
    status: "active",
  },
];

const multipleFactors = [
  {
    id: "factor-1",
    type: FLOW_TYPES.sms,
    phoneNumber: "+15551234567",
    status: "active",
  },
  {
    id: "factor-2",
    type: FLOW_TYPES.voice,
    phoneNumber: "+15559876543",
    status: "active",
  },
  {
    id: "factor-3",
    type: FLOW_TYPES.sms,
    phoneNumber: "+15555551234",
    status: "active",
  },
];

// Story: Single SMS Factor
export const SingleSMSFactor = Template.bind({});
SingleSMSFactor.args = {
  userPhoneFactors: singleSMSFactor,
  userSelectedMfaFactor: singleSMSFactor[0],
  parentPage: PAGES.addMFAPage,
};
SingleSMSFactor.parameters = {
  docs: {
    description: {
      story: "OtpSelection component with a single SMS verification factor",
    },
  },
};

// Story: Single Voice Factor
export const SingleVoiceFactor = Template.bind({});
SingleVoiceFactor.args = {
  userPhoneFactors: singleVoiceFactor,
  userSelectedMfaFactor: singleVoiceFactor[0],
  parentPage: PAGES.addMFAPage,
};
SingleVoiceFactor.parameters = {
  docs: {
    description: {
      story:
        "OtpSelection component with a single voice call verification factor",
    },
  },
};

// Story: Multiple Factors
export const MultipleFactors = Template.bind({});
MultipleFactors.args = {
  userPhoneFactors: multipleFactors,
  userSelectedMfaFactor: multipleFactors[0],
  parentPage: PAGES.addMFAPage,
};
MultipleFactors.parameters = {
  docs: {
    description: {
      story:
        "OtpSelection component with multiple verification factors (SMS and Voice)",
    },
  },
};

// Story: Delete MFA Context
export const DeleteMFAContext = Template.bind({});
DeleteMFAContext.args = {
  userPhoneFactors: multipleFactors,
  userSelectedMfaFactor: multipleFactors[1],
  parentPage: PAGES.deleteMFAPage,
};
DeleteMFAContext.parameters = {
  docs: {
    description: {
      story:
        "OtpSelection component in delete MFA context with different page content",
    },
  },
};

// Story: No Factors (Edge Case)
export const NoFactors = Template.bind({});
NoFactors.args = {
  userPhoneFactors: [],
  userSelectedMfaFactor: null,
  parentPage: PAGES.addMFAPage,
};
NoFactors.parameters = {
  docs: {
    description: {
      story: "OtpSelection component with no available verification factors",
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  userPhoneFactors: multipleFactors,
  userSelectedMfaFactor: multipleFactors[0],
  parentPage: PAGES.addMFAPage,
};
French.parameters = {
  docs: {
    description: {
      story: "OtpSelection component rendered in French",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/otp-selection",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
