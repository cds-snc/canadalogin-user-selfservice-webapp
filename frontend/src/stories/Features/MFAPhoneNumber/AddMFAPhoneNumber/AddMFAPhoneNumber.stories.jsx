import AddMFAPhoneNumber from "../../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPhoneNumber.jsx";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
} from "../../../../utils/constants.jsx";

export default {
  title:
    "GC Sign In/Features/MFAPhoneNumber/AddMFAPhoneNumber/AddMFAPhoneNumber",
  component: AddMFAPhoneNumber,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onNext: { action: "next clicked" },
    onCancel: { action: "cancel clicked" },
    onChangePhoneForm: { action: "phone form changed" },
    setErrorCode: { action: "error code set" },
  },
};

const Template = (args) => <AddMFAPhoneNumber {...args} />;

export const Default = Template.bind({});
Default.args = {
  phoneFormData: { phoneNumber: "", otpType: FLOW_TYPES.sms },
  errorMessage: "",
};

export const WithPhoneNumber = Template.bind({});
WithPhoneNumber.args = {
  phoneFormData: { phoneNumber: "+15551234567", otpType: FLOW_TYPES.sms },
  errorMessage: "",
};

export const WithError = Template.bind({});
WithError.args = {
  phoneFormData: { phoneNumber: "123", otpType: FLOW_TYPES.sms },
  errorMessage: "Invalid phone number format",
};
