import { AVAILABLE_LANGUAGES, PAGES } from "../../../utils/constants";
import { buildTestCase, TestTemplate } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Features/IDV/StartIdentityProofingPage",
  component: TestTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "StartIdentityProofingPage allows users to choose an identity verification method, including online and in-person verification options.",
      },
    },
  },
};

export const Default = TestTemplate.bind({});
Default.args = {};
Default.parameters = buildTestCase.parameters(
  "/idv",
  { language: AVAILABLE_LANGUAGES.en },
  null,
);

Default.parameters.docs = {
  description: {
    story: "Default English view of the Start Identity Proofing page.",
  },
};

export const French = TestTemplate.bind({});
French.args = {};
French.parameters = buildTestCase.parameters(
  "/idv/start",
  { language: AVAILABLE_LANGUAGES.fr },
  null,
);

French.parameters.docs = {
  description: {
    story: "French (bilingual) view of the Start Identity Proofing page.",
  },
};
