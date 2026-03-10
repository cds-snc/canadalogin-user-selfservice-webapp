import DeleteMFAPhoneNumberConfirm from "../../../../features/MFAPhoneNumber/DeleteMFAPhoneNumber/component/DeleteMFAPhoneNumberConfirm.jsx";
import { AVAILABLE_LANGUAGES } from "../../../../utils/constants";

export default {
  title:
    "GC Sign In/Features/MFAPhoneNumber/DeleteMFAPhoneNumber/DeleteMFAPhoneNumberConfirm",
  component: DeleteMFAPhoneNumberConfirm,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onNext: { action: "delete confirmed" },
    onCancel: { action: "cancel clicked" },
  },
};

const Template = (args) => <DeleteMFAPhoneNumberConfirm {...args} />;

export const Default = Template.bind({});
Default.args = {
  phoneNumber: "+15551234567",
  errorMessage: "",
  localLoading: false,
};

export const WithError = Template.bind({});
WithError.args = {
  phoneNumber: "+15551234567",
  errorMessage: "Failed to delete MFA phone number. Please try again.",
  localLoading: false,
};

export const Loading = Template.bind({});
Loading.args = {
  phoneNumber: "+15551234567",
  errorMessage: "",
  localLoading: true,
};
