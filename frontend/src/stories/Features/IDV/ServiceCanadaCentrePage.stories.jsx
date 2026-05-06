import { AVAILABLE_LANGUAGES, PAGES } from "../../../utils/constants";
import { buildTestCase, TestTemplate } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Features/IDV/ServiceCanadaCentrePage",
  component: TestTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "ServiceCanadaCentrePage presents the pre-visit instructions for in-person identity proofing at a Service Canada Centre. It displays a 3-step process overview and prompts the user to continue to receive their unique identification code.",
      },
    },
  },
  args: {
    page: PAGES.idvServiceCanadaCentrePage,
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
  "/idv/in-person/service-canada-centre",
  { language: AVAILABLE_LANGUAGES.en },
  null,
);
Default.parameters.docs = {
  description: {
    story:
      "Default English view of the Service Canada Centre pre-visit instructions page.",
  },
};

export const French = TestTemplate.bind({});
French.args = {};
French.parameters = buildTestCase.parameters(
  "/idv/in-person/service-canada-centre",
  { language: AVAILABLE_LANGUAGES.fr },
  null,
);
French.parameters.docs = {
  description: {
    story:
      "French (bilingual) view of the Service Canada Centre pre-visit instructions page.",
  },
};
