/**
 * Utility functions for manipulating the browser favicon
 */

/**
 * Changes the favicon to a specified URL
 * @param {string} faviconUrl - The URL of the new favicon
 */
export const changeFavicon = (faviconUrl) => {
  // Find existing favicon link element
  let link =
    document.querySelector("link[rel*='icon']") ||
    document.createElement("link");

  // Set the favicon properties
  link.type = "image/x-icon";
  link.rel = "shortcut icon";
  link.href = faviconUrl;

  // Add to head if it's a new element
  if (!document.querySelector("link[rel*='icon']")) {
    document.getElementsByTagName("head")[0].appendChild(link);
  }
};

/**
 * Restores the default Canada.ca favicon
 */
export const restoreDefaultFavicon = () => {
  changeFavicon(
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon.ico",
  );
};

/**
 * Changes favicon to a warning/alert icon (red triangle with white exclamation mark)
 */
export const setWarningFavicon = () => {
  // Use a FontAwesome SVG warning icon as favicon
  // Example uses the FontAwesome exclamation-triangle SVG path
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="32" height="32">
      <path fill="#FF0000" d="M569.517 440.13L327.4 49.98c-18.2-29.2-60.6-29.2-78.8 0L6.483 440.13C-12.2 469.3 9.8 512 48.9 512h478.2c39.1 0 61.1-42.7 42.4-71.87zM288 392c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm32-112c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16v-96c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v96z"/>
    </svg>
  `;
  const svgUrl = "data:image/svg+xml;base64," + btoa(svg);
  changeFavicon(svgUrl);
};
