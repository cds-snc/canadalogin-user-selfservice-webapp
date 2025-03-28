/** @type { import('@storybook/react').Preview } */
import '../src/index.css';
import { initialize, mswLoader } from 'msw-storybook-addon';

initialize();

const preview = {
    loaders: [mswLoader],
    parameters: {
        reactRouter: {
            routePath: '/myroute',
        },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;