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

const SHADOW_NOTICE_PRINT_STYLE = `
  [part="notice-title"],
  [part="title"],
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: 0.75em !important;
  }
`;

const GLOBAL_PRINT_STYLE = `
  @media print {
    @page {
      margin: 8mm;
    }
  }
`;

export const SERVICE_CANADA_CENTRE_PRINT_OPTIONS: PrintOptions =
  {
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
        css: SHADOW_NOTICE_PRINT_STYLE,
      },
    ],
    printTitle: " ",
    printCss: GLOBAL_PRINT_STYLE,
  };
