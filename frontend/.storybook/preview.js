/** @type { import('@storybook/react').Preview } */
import "../src/index.css";
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
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "error",
    },
  },
};

export default preview;
