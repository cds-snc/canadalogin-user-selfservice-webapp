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
      // Enforce accessibility violations in Storybook tests.
      test: "error",
      config: {
        rules: [
          // WCAG 2.1 AA compliance rules
          { id: "color-contrast", enabled: true },
          { id: "heading-order", enabled: true },
          { id: "landmark-unique", enabled: true },
          { id: "page-has-heading-one", enabled: false }, // Disabled for component testing
          { id: "region", enabled: false }, // Disabled for component testing
          { id: "skip-link", enabled: true },

          // Government-specific accessibility requirements
          { id: "html-has-lang", enabled: true },
          { id: "html-lang-valid", enabled: true },
          { id: "valid-lang", enabled: true },

          // Form accessibility
          { id: "label", enabled: true },
          { id: "form-field-multiple-labels", enabled: true },
          { id: "input-button-name", enabled: true },

          // ARIA best practices
          { id: "aria-allowed-attr", enabled: true },
          { id: "aria-hidden-focus", enabled: true },
          { id: "aria-required-attr", enabled: true },
          { id: "aria-roles", enabled: true },
          { id: "aria-valid-attr-value", enabled: true },
          { id: "aria-valid-attr", enabled: true },

          // Keyboard accessibility
          { id: "tabindex", enabled: true },
          { id: "focus-order-semantics", enabled: true },

          // Images and media
          { id: "image-alt", enabled: true },
          { id: "image-redundant-alt", enabled: true },

          // Links
          { id: "link-name", enabled: true },
          { id: "link-in-text-block", enabled: true },
        ],
        tags: ["wcag2a", "wcag2aa", "wcag21aa"],
      },
      options: {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa"],
        },
        restoreScroll: true,
      },
      manual: true,
    },
  },
};

export default preview;
