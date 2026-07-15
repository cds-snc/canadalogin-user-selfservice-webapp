import type { PrintOptions } from "../../helpers/printWithShadowDomStyles";

const PRINT_HIDE_HOST_SELECTORS = [
  "gcds-header",
  "gcds-top-nav",
  "gcds-footer",
  ".gcds-header",
  ".gcds-top-nav",
  ".gcds-top-nav-container",
  ".gcds-footer",
];

const SHADOW_PRINT_STYLE = `
  .gcds-top-nav,
  nav,
  [part="top-nav"],
  [part="menu"] {
    display: none !important;
  }
`;

const SHADOW_PRINT_TYPOGRAPHY_STYLE = `
  :host {
    zoom: 0.75;
  }
`;

const SHADOW_NOTICE_TITLE_PRINT_STYLE = `
  [part="notice-title"] gcds-heading,
  [part="title"] gcds-heading,
  gcds-heading {
    zoom: 0.75;
  }
`;

export const SERVICE_CANADA_CENTRE_PRINT_OPTIONS: PrintOptions = {
  hideHosts: PRINT_HIDE_HOST_SELECTORS,
  shadowStyles: [
    {
      hosts: PRINT_HIDE_HOST_SELECTORS,
      css: SHADOW_PRINT_STYLE,
    },
    {
      hosts: ["gcds-heading", "gcds-text"],
      css: SHADOW_PRINT_TYPOGRAPHY_STYLE,
    },
    {
      hosts: ["gcds-notice"],
      css: SHADOW_NOTICE_TITLE_PRINT_STYLE,
    },
  ],
};
    