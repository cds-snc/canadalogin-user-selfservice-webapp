import { AVAILABLE_LANGUAGES, PAGES } from "../../../utils/constants";
import { buildTestCase, TestTemplate } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Features/IDV/ProvenInformationCard",
  component: TestTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "ProvenInformationCard displays identity-proofed user information (name, date of birth, ID document) and provides a button to initiate an updated identity proofing process.",
      },
    },
  },
  args: {
    page: PAGES.idvProvenInformationCard,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    firstName: "Test",
    lastName: "User",
  },
};

export const Default = TestTemplate.bind({});
Default.args = {};
Default.parameters = buildTestCase.parameters(
  "/profile",
  { language: AVAILABLE_LANGUAGES.en },
  null,
);
Default.parameters.docs = {
  description: {
    story: "Default English view of the Proven Information Card.",
  },
};

export const French = TestTemplate.bind({});
French.args = {};
French.parameters = buildTestCase.parameters(
  "/profile",
  { language: AVAILABLE_LANGUAGES.fr },
  null,
);
French.parameters.docs = {
  description: {
    story: "French view of the Proven Information Card.",
  },
};
