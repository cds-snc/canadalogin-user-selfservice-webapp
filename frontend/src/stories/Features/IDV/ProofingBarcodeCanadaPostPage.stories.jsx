import { AVAILABLE_LANGUAGES, PAGES } from "../../../utils/constants";
import { buildTestCase, TestTemplate } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Features/IDV/ProofingBarcodeCanadaPostPage",
  component: TestTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "ProofingBarcodeCanadaPostPage displays the Canada Post proofing barcode and in-person instructions, including identity details passed from the previous step.",
      },
    },
  },
  args: {
    page: PAGES.idvProofingBarcodeCanadaPostPage,
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
  "/idv/in-person/canada-post/idv-code",
  { language: AVAILABLE_LANGUAGES.en },
  null,
);
Default.parameters.docs = {
  description: {
    story:
      "Default English view of the Canada Post proofing barcode page showing a generated barcode and identity details.",
  },
};

export const French = TestTemplate.bind({});
French.args = {};
French.parameters = buildTestCase.parameters(
  "/idv/in-person/canada-post/idv-code",
  { language: AVAILABLE_LANGUAGES.fr },
  null,
);
French.parameters.docs = {
  description: {
    story: "French (bilingual) view of the Canada Post proofing barcode page.",
  },
};
