import ViewContactPhoneNumber from "../../../features/ContactPhoneNumber/components/ViewContactPhoneNumber";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants";

export default {
  title: "GC Sign In/Features/ContactPhoneNumber/ViewContactPhoneNumber",
  component: ViewContactPhoneNumber,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Component for displaying current contact phone numbers in a user's profile with options to edit.",
      },
    },
  },
};

const Template = (args) => <ViewContactPhoneNumber {...args} />;

// Mock page content
const mockPageContent = {
  1: "Contact phone number",
  2: "Update your contact phone number",
  3: "We'll use this to contact you about your account.",
  4: "Edit",
  5: "Add phone number",
};

// Mock phone numbers
const singlePhoneNumber = [
  {
    type: "mobile",
    value: "+15551234567",
    verified: true,
  },
];

const multiplePhoneNumbers = [
  {
    type: "mobile",
    value: "+15551234567",
    verified: true,
  },
  {
    type: "home",
    value: "+15559876543",
    verified: true,
  },
];

const noPhoneNumbers = [];

// Story: Single Phone Number
export const SinglePhoneNumber = Template.bind({});
SinglePhoneNumber.args = {
  pageContent: mockPageContent,
  phoneNumbers: singlePhoneNumber,
};
SinglePhoneNumber.parameters = {
  docs: {
    description: {
      story: "View showing a single contact phone number with edit option.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/view-contact-phone",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Multiple Phone Numbers
export const MultiplePhoneNumbers = Template.bind({});
MultiplePhoneNumbers.args = {
  pageContent: mockPageContent,
  phoneNumbers: multiplePhoneNumbers,
};
MultiplePhoneNumbers.parameters = {
  docs: {
    description: {
      story: "View showing multiple contact phone numbers with edit option.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/view-contact-phone",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: No Phone Numbers
export const NoPhoneNumbers = Template.bind({});
NoPhoneNumbers.args = {
  pageContent: mockPageContent,
  phoneNumbers: noPhoneNumbers,
};
NoPhoneNumbers.parameters = {
  docs: {
    description: {
      story:
        "View when no contact phone numbers are set, showing option to add one.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/view-contact-phone",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  pageContent: {
    1: "Numéro de téléphone de contact",
    2: "Mettre à jour votre numéro de téléphone de contact",
    3: "Nous l'utiliserons pour vous contacter au sujet de votre compte.",
    4: "Modifier",
    5: "Ajouter un numéro de téléphone",
  },
  phoneNumbers: singlePhoneNumber,
};
French.parameters = {
  docs: {
    description: {
      story:
        "Contact phone number view displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/view-contact-phone",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
