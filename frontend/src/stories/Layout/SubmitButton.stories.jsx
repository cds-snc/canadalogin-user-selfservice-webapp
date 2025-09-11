import SubmitButton from "../../components/Layout/SubmitButton.jsx";

export default {
  title: "GC Sign In/Layout/SubmitButton",
  component: SubmitButton,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: "fullscreen",
  },
};

export const English = {
  args: {
    currentLang: "en",
  },
};

export const French = {
  args: {
    currentLang: "fr",
  },
};

export const NoLanguage = {
  args: {
    currentLang: "",
  },
};

export const EnglishDisabled = {
  args: {
    currentLang: "en",
    disabled: true,
  },
};

export const FrenchDisabled = {
  args: {
    currentLang: "fr",
    disabled: true,
  },
};

export const NoLanguageDisabled = {
  args: {
    currentLang: "",
    disabled: true,
  },
};
