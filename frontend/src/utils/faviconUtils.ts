export const changeFavicon = (faviconUrl: string) => {
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");

  if (!link) {
    link = document.createElement("link");
    document.head.appendChild(link);
  }

  link.type = "image/x-icon";
  link.rel = "shortcut icon";
  link.href = faviconUrl;
};

export const restoreDefaultFavicon = () => {
  changeFavicon(
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon.ico",
  );
};

export const setWarningFavicon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="32" height="32">
      <path fill="#FF0000" d="M569.517 440.13L327.4 49.98c-18.2-29.2-60.6-29.2-78.8 0L6.483 440.13C-12.2 469.3 9.8 512 48.9 512h478.2c39.1 0 61.1-42.7 42.4-71.87zM288 392c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm32-112c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16v-96c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v96z"/>
    </svg>
  `;

  changeFavicon(`data:image/svg+xml;base64,${btoa(svg)}`);
};
