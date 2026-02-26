import AddMFAOtpVerification from "../../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAOtpVerification";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
} from "../../../../utils/constants";

export default {
  title:
    "GC Sign In/Features/MFAPhoneNumber/AddMFAPhoneNumber/AddMFAOtpVerification",
  component: AddMFAOtpVerification,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onNext: { action: "next clicked" },
    onCancel: { action: "cancel clicked" },
    onBack: { action: "back clicked" },
    onChangePhoneForm: { action: "phone form changed" },
    requestNewOtpCode: { action: "new otp requested" },
    setErrorCode: { action: "error code set" },
  },
};

const Template = (args) => <AddMFAOtpVerification {...args} />;

export const SMSVerification = Template.bind({});
SMSVerification.args = {
  phoneFormData: {
    phoneNumber: "+15551234567",
    formattedPhoneNumber: "+1 555-123-4567",
    otpType: FLOW_TYPES.sms,
    otp: "",
  },
  errorMessage: "",
};

export const VoiceVerification = Template.bind({});
VoiceVerification.args = {
  phoneFormData: {
    phoneNumber: "+15551234567",
    formattedPhoneNumber: "+1 555-123-4567",
    otpType: FLOW_TYPES.voice,
    otp: "",
  },
  errorMessage: "",
};

export const WithOtpCode = Template.bind({});
WithOtpCode.args = {
  phoneFormData: {
    phoneNumber: "+15551234567",
    formattedPhoneNumber: "+1 555-123-4567",
    otpType: FLOW_TYPES.sms,
    otp: "123456",
  },
  errorMessage: "",
};
