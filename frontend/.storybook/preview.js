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

      // Enhanced axe-core configuration for Government of Canada standards
      config: {
        rules: {
          // WCAG 2.1 AA compliance rules
          "color-contrast": { enabled: true },
          "heading-order": { enabled: true },
          "landmark-unique": { enabled: true },
          "page-has-heading-one": { enabled: false }, // Disabled for component testing
          region: { enabled: false }, // Disabled for component testing
          "skip-link": { enabled: true },

          // Government-specific accessibility requirements
          "html-has-lang": { enabled: true },
          "html-lang-valid": { enabled: true },
          lang: { enabled: true },

          // Form accessibility
          label: { enabled: true },
          "form-field-multiple-labels": { enabled: true },
          "input-button-name": { enabled: true },

          // ARIA best practices
          "aria-allowed-attr": { enabled: true },
          "aria-hidden-focus": { enabled: true },
          "aria-label": { enabled: true },
          "aria-labelledby": { enabled: true },
          "aria-required-attr": { enabled: true },
          "aria-roles": { enabled: true },
          "aria-valid-attr-value": { enabled: true },
          "aria-valid-attr": { enabled: true },

          // Keyboard accessibility
          keyboard: { enabled: true },
          tabindex: { enabled: true },
          "focus-order-semantics": { enabled: true },

          // Images and media
          "image-alt": { enabled: true },
          "image-redundant-alt": { enabled: true },

          // Links
          "link-name": { enabled: true },
          "link-in-text-block": { enabled: true },
        },
        tags: ["wcag2a", "wcag2aa", "wcag21aa"],
      },

      // Additional options
      options: {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa"],
        },
        restoreScroll: true,
      },

      // Manual accessibility checks to perform
      manual: true,
    },
  },
};

export default preview;
