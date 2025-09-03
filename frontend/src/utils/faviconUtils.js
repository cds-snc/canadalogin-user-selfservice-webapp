/**
 * Utility functions for manipulating the browser favicon
 */

/**
 * Changes the favicon to a specified URL
 * @param {string} faviconUrl - The URL of the new favicon
 */
export const changeFavicon = (faviconUrl) => {
  // Find existing favicon link element
  let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  
  // Set the favicon properties
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = faviconUrl;
  
  // Add to head if it's a new element
  if (!document.querySelector("link[rel*='icon']")) {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
};

/**
 * Restores the default Canada.ca favicon
 */
export const restoreDefaultFavicon = () => {
  changeFavicon('https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon.ico');
};

/**
 * Changes favicon to a warning/alert icon (red triangle with white exclamation mark)
 */
export const setWarningFavicon = () => {
  // Create a red triangle with white exclamation mark favicon using canvas
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Clear canvas with transparent background
  ctx.clearRect(0, 0, 32, 32);
  
  // Red triangle background
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.moveTo(16, 2);    // Top vertex
  ctx.lineTo(30, 28);   // Bottom right vertex
  ctx.lineTo(2, 28);    // Bottom left vertex
  ctx.closePath();
  ctx.fill();
  
  // White exclamation mark - main body
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(14, 8, 4, 12);  // Vertical line of exclamation mark
  
  // White exclamation mark - dot
  ctx.beginPath();
  ctx.arc(16, 24, 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // Convert canvas to data URL and set as favicon
  changeFavicon(canvas.toDataURL());
};
