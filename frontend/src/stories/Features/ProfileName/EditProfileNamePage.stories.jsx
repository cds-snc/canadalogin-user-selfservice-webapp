import { AVAILABLE_LANGUAGES, PAGES } from "../../../utils/constants";
import { Template } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Features/ProfileName/EditProfileNamePage",
  component: Template,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "EditProfileNamePage container component for updating user profile name. Manages the multi-step flow including name entry, confirmation, and success.",
      },
    },
  },
  args: {
    page: PAGES.editProfileNamePage,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    firstName: "John",
    lastName: "Doe",
  },
};

export const Default = Template.bind({});
Default.args = {};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default state of the profile name editing flow. Uses Template for proper routing context.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-profile-name",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

export const French = Template.bind({});
French.args = {};
French.parameters = {
  docs: {
    description: {
      story:
        "Profile name editing flow displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/edit-profile-name",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
