/** @type { import('@storybook/react').Preview } */
import '../src/index.css';
import '@cdssnc/gcds-components-react/gcds.css';
import {
  initialize,
  mswLoader
} from 'msw-storybook-addon';
import Page from "../src/views/Page.js";
import {
  withRouter
} from "storybook-addon-remix-react-router";

initialize();

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;