/** @type { import('@storybook/react-vite').Preview } */
import "../src/index.css";
import "../src/i18n";
import { initialize, mswLoader } from "msw-storybook-addon";
import { withRouter } from "storybook-addon-remix-react-router";

// Initialize MSW with quiet mode to suppress request/response logging
initialize({
  onUnhandledRequest: "bypass",
  quiet: true,
});

const preview = {
  loaders: [mswLoader],
  decorators: [withRouter],
  tags: ["autodocs"],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // Incremental rollout: surface issues in Storybook tests without failing CI.
      test: "todo",
    },
  },
};

export default preview;
