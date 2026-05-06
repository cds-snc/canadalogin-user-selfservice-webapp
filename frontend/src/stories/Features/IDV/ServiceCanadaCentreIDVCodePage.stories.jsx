import { AVAILABLE_LANGUAGES, PAGES } from "../../../utils/constants";
import { buildTestCase, TestTemplate } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Features/IDV/ServiceCanadaCentreIDVCodePage",
  component: TestTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "ServiceCanadaCentreIDVCodePage displays the unique identification code generated for the user's in-person identity proofing at a Service Canada Centre, along with instructions on how to use it.",
      },
    },
  },
  args: {
    page: PAGES.idvServiceCanadaCentreCodePage,
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
  "/idv/in-person/service-canada-centre/code",
  { language: AVAILABLE_LANGUAGES.en },
  null,
);
Default.parameters.docs = {
  description: {
    story:
      "Default English view of the Service Canada Centre IDV code page showing the user's unique identification code.",
  },
};

export const French = TestTemplate.bind({});
French.args = {};
French.parameters = buildTestCase.parameters(
  "/idv/in-person/service-canada-centre/code",
  { language: AVAILABLE_LANGUAGES.fr },
  null,
);
French.parameters.docs = {
  description: {
    story:
      "French (bilingual) view of the Service Canada Centre IDV code page.",
  },
};
