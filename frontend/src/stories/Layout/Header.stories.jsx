import Header from '../../components/Layout/Header.jsx';

export default {
  title: 'GC Sign In/Layout/Header',
  component: Header,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  }
};

export const English = {
  args:{
    currentLang:"en",
    langHref:"/fr"
  }
};

export const French = {
  args:{
    currentLang:"fr",
    langHref:"/en"
  }
};

export const NoLanguage = {
  args:{
    currentLang:"",
    langHref:"/en"
  }
};

