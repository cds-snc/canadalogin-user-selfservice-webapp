/** @type { import('@storybook/react').Preview } */
import '../src/index.css';
import { initialize, mswLoader } from 'msw-storybook-addon';
import Page from "../src/views/Page.js";
import {withRouter} from "storybook-addon-remix-react-router";

initialize();

const preview = {
    loaders: [mswLoader],
    decorators: [withRouter],
    component: Page,
    tags: ['autodocs'],
    parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  }
};

export default preview;