import AddSecondMFA from "../../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddSecondMFA.jsx";
import { AVAILABLE_LANGUAGES } from "../../../../utils/constants";

export default {
  title: "GC Sign In/Features/MFAPhoneNumber/AddMFAPhoneNumber/AddSecondMFA",
  component: AddSecondMFA,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onNext: { action: "next clicked" },
    onCancel: { action: "cancel clicked" },
  },
};

const Template = (args) => <AddSecondMFA {...args} />;

export const Default = Template.bind({});
Default.args = {
  phoneFormData: {
    phoneNumber: "+15551234567",
    formattedPhoneNumber: "+1 555-123-4567",
  },
};

export const French = Template.bind({});
French.args = {
  phoneFormData: {
    phoneNumber: "+15551234567",
    formattedPhoneNumber: "+1 555-123-4567",
  },
};
French.parameters = {
  nextjs: {
    router: {
      pathname: "/fr/add-second-mfa",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
