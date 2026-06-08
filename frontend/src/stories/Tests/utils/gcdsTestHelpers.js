/**
 * Utility functions for testing GCDS components in Storybook
 * These helpers eliminate the need for hardcoded timeouts and provide
 * consistent methods for interacting with GCDS shadow DOM elements.
 */

import { expect, waitFor } from "storybook/test";

/**
 * Default timeout for waitFor operations (in milliseconds)
 */
export const DEFAULT_TIMEOUT = 5000;

/**
 * Waits for a GCDS component to be fully rendered and ready for interaction
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string} selector - The GCDS component selector (e.g., 'gcds-button', 'gcds-heading')
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<HTMLElement>} The found GCDS element
 */
export async function waitForGcdsComponent(
  canvasElement,
  selector,
  timeout = DEFAULT_TIMEOUT,
) {
  let element;

  await waitFor(
    async () => {
      element = canvasElement.querySelector(selector);
      await expect(element).toBeTruthy();
      // Ensure the element is visible and has rendered content
      await expect(element).toBeInTheDocument();
    },
    { timeout },
  );

  return element;
}

/**
 * Waits for multiple GCDS components to be rendered
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string} selector - The GCDS component selector
 * @param {number} expectedCount - Expected number of elements (minimum)
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<NodeList>} The found GCDS elements
 */
export async function waitForGcdsComponents(
  canvasElement,
  selector,
  expectedCount = 1,
  timeout = DEFAULT_TIMEOUT,
) {
  let elements;

  await waitFor(
    async () => {
      elements = canvasElement.querySelectorAll(selector);
      await expect(elements.length).toBeGreaterThanOrEqual(expectedCount);
    },
    { timeout },
  );

  return elements;
}

/**
 * Finds a GCDS button by role and waits for it to be interactive
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string} role - The button role ('danger', 'secondary', 'primary')
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<HTMLElement>} The found button element (shadow DOM or GCDS element)
 */
export async function waitForGcdsButton(
  canvasElement,
  role,
  timeout = DEFAULT_TIMEOUT,
) {
  let targetButton;

  await waitFor(
    async () => {
      const buttons = canvasElement.querySelectorAll("gcds-button");

      targetButton = Array.from(buttons).find((btn) => {
        if (btn.shadowRoot) {
          const innerButton = btn.shadowRoot.querySelector("button");
          return innerButton?.className.includes(`button--role-${role}`);
        }
        return false;
      });

      await expect(targetButton).toBeTruthy();
    },
    { timeout },
  );

  return targetButton;
}

/**
 * Gets the actual clickable button element from a GCDS button (handling shadow DOM)
 * @param {HTMLElement} gcdsButton - The GCDS button element
 * @returns {HTMLElement|null} The actual button element or null if not found
 */
export function getClickableButton(gcdsButton) {
  if (gcdsButton && gcdsButton.shadowRoot) {
    return (
      gcdsButton.shadowRoot.querySelector('button[part="button"]') ||
      gcdsButton.shadowRoot.querySelector("button")
    );
  }
  return gcdsButton;
}

/**
 * Waits for text content to appear in the component
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string|RegExp} textPattern - Text or regex pattern to search for
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<boolean>} True if text is found
 */
export async function waitForTextContent(
  canvasElement,
  textPattern,
  timeout = DEFAULT_TIMEOUT,
) {
  await waitFor(
    async () => {
      // Check both document body (for portals) and canvas element
      const documentTextContent = document.body.textContent;
      const canvasTextContent = canvasElement.textContent;
      const combinedContent = documentTextContent + " " + canvasTextContent;

      if (typeof textPattern === "string") {
        await expect(combinedContent.includes(textPattern)).toBeTruthy();
      } else {
        await expect(textPattern.test(combinedContent)).toBeTruthy();
      }
    },
    { timeout },
  );

  return true;
}

/**
 * Waits for a phone number to be displayed (handles multiple formats)
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string} phoneNumber - The phone number to look for (any format)
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<boolean>} True if phone number is found
 */
export async function waitForPhoneNumber(
  canvasElement,
  phoneNumber,
  timeout = DEFAULT_TIMEOUT,
) {
  await waitFor(
    async () => {
      const phoneText = canvasElement.textContent;
      // Check for various phone number formats
      const hasFormattedPhone =
        phoneText.includes(phoneNumber) ||
        phoneText.includes(phoneNumber.replace(/^\+1/, "+1 (")) ||
        phoneText.includes(
          phoneNumber.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, "+1 ($1) $2-$3"),
        ) ||
        phoneText.includes(phoneNumber.replace(/\D/g, ""));

      await expect(hasFormattedPhone).toBeTruthy();
    },
    { timeout },
  );

  return true;
}

/**
 * Waits for component to be ready by checking for key elements
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {Object} options - Configuration options
 * @param {boolean} options.expectHeading - Whether to wait for gcds-heading (default: true)
 * @param {boolean} options.expectButtons - Whether to wait for buttons (default: true)
 * @param {number} options.expectedButtonCount - Minimum number of buttons expected (default: 2)
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<Object>} Object containing found elements
 */
export async function waitForComponentReady(
  canvasElement,
  options = {},
  timeout = DEFAULT_TIMEOUT,
) {
  const {
    expectHeading = true,
    expectButtons = true,
    expectedButtonCount = 2,
  } = options;

  const result = {};

  await waitFor(
    async () => {
      if (expectHeading) {
        result.heading = canvasElement.querySelector("gcds-heading");
        await expect(result.heading).toBeTruthy();
      }

      if (expectButtons) {
        result.buttons = canvasElement.querySelectorAll("gcds-button");
        await expect(result.buttons.length).toBeGreaterThanOrEqual(
          expectedButtonCount,
        );
      }
    },
    { timeout },
  );

  return result;
}

/**
 * Waits for a GCDS notice component to be rendered and validates its structure
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {Object} options - Configuration options
 * @param {boolean} options.expectText - Whether to wait for gcds-text elements (default: true)
 * @param {number} options.minTextCount - Minimum number of gcds-text elements expected (default: 1)
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<Object>} Object containing found notice and text elements
 */
export async function waitForGcdsNotice(
  canvasElement,
  options = {},
  timeout = DEFAULT_TIMEOUT,
) {
  const { expectText = true, minTextCount = 1 } = options;

  const result = {};

  await waitFor(
    async () => {
      result.notice = canvasElement.querySelector("gcds-notice");
      await expect(result.notice).toBeTruthy();
      await expect(result.notice).toBeInTheDocument();

      if (expectText) {
        result.textElements = canvasElement.querySelectorAll("gcds-text");
        await expect(result.textElements.length).toBeGreaterThanOrEqual(
          minTextCount,
        );
      }
    },
    { timeout },
  );

  return result;
}

/**
 * Waits for a modal dialog to be rendered (handles both React Modal portals and regular modals)
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.canvasElement - The canvas element to search within as fallback
 * @param {boolean} options.expectButtons - Whether to wait for buttons (default: true)
 * @param {number} options.minButtonCount - Minimum number of buttons expected (default: 2)
 * @param {boolean} options.shouldExist - Whether modal should exist (default: true)
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<Object>} Object containing found modal and related elements
 */
export async function waitForModal(options = {}, timeout = DEFAULT_TIMEOUT) {
  const {
    canvasElement,
    expectButtons = true,
    minButtonCount = 2,
    shouldExist = true,
  } = options;

  const result = {};

  if (shouldExist) {
    await waitFor(
      async () => {
        // Check for modal in document body first (React Modal portal)
        result.modal =
          document.querySelector(".session-timeout-modal") ||
          document.querySelector('[role="dialog"]') ||
          document.querySelector('[class*="modal"]');

        // Fallback to canvas element if provided
        if (!result.modal && canvasElement) {
          result.modal =
            canvasElement.querySelector(".session-timeout-modal") ||
            canvasElement.querySelector('[role="dialog"]') ||
            canvasElement.querySelector('[class*="modal"]') ||
            canvasElement;
        }

        await expect(result.modal).toBeTruthy();
        await expect(result.modal).toBeInTheDocument();

        if (expectButtons) {
          const documentButtons = document.querySelectorAll("gcds-button");
          const canvasButtons = canvasElement
            ? canvasElement.querySelectorAll("gcds-button")
            : [];
          const totalButtons = Math.max(
            documentButtons.length,
            canvasButtons.length,
          );

          await expect(totalButtons).toBeGreaterThanOrEqual(minButtonCount);
          result.buttons =
            documentButtons.length > 0 ? documentButtons : canvasButtons;
        }
      },
      { timeout },
    );
  } else {
    // Wait to verify modal does NOT exist
    await waitFor(
      async () => {
        const modalInDocument =
          document.querySelector(".session-timeout-modal") ||
          document.querySelector('[role="dialog"]');

        const modalInCanvas = canvasElement
          ? canvasElement.querySelector(".session-timeout-modal") ||
            canvasElement.querySelector('[role="dialog"]')
          : null;

        await expect(modalInDocument).toBeFalsy();
        if (canvasElement) {
          await expect(modalInCanvas).toBeFalsy();
        }
      },
      { timeout },
    );
  }

  return result;
}

/**
 * Waits for a GCDS input to be ready and returns the actual input element
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string} testId - The data-testid of the GCDS input
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<HTMLElement>} The actual input element inside shadow DOM
 */
export async function waitForGcdsInput(
  canvasElement,
  testId,
  timeout = DEFAULT_TIMEOUT,
) {
  let inputElement;

  await waitFor(
    async () => {
      const gcdsInput = canvasElement.querySelector(
        `[data-testid="${testId}"]`,
      );
      await expect(gcdsInput).toBeTruthy();
      await expect(gcdsInput).toBeInTheDocument();

      // Try to get the actual input from shadow DOM
      if (gcdsInput && gcdsInput.shadowRoot) {
        inputElement =
          gcdsInput.shadowRoot.querySelector('input[part="input"]') ||
          gcdsInput.shadowRoot.querySelector(`input#${testId}`) ||
          gcdsInput.shadowRoot.querySelector("input");
      }

      // Fallback methods if shadow DOM doesn't work
      if (!inputElement) {
        inputElement =
          canvasElement.querySelector(`input[name="${testId}"]`) ||
          canvasElement.querySelector(`#${testId}`) ||
          canvasElement.querySelector(
            `gcds-input[data-testid="${testId}"] input`,
          );
      }

      await expect(inputElement).toBeTruthy();
      await expect(inputElement).toBeInTheDocument();
    },
    { timeout },
  );

  return inputElement;
}

/**
 * Waits for a button by text content to be clickable
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string|RegExp} buttonText - Text content of the button to find
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<HTMLElement>} The clickable button element
 */
export async function waitForButtonByText(
  canvasElement,
  buttonText,
  timeout = DEFAULT_TIMEOUT,
) {
  let clickableButton;

  await waitFor(
    async () => {
      // Try to find button by text in document (for portals) and canvas
      let button = null;

      // Check document first for portals
      const allButtons = document.querySelectorAll("gcds-button, button");
      for (const btn of allButtons) {
        const text = btn.textContent || btn.innerText || "";
        if (typeof buttonText === "string") {
          if (text.includes(buttonText)) {
            button = btn;
            break;
          }
        } else if (buttonText.test && buttonText.test(text)) {
          button = btn;
          break;
        }
      }

      // Fallback to canvas element search
      if (!button) {
        const canvasButtons = canvasElement.querySelectorAll(
          "gcds-button, button",
        );
        for (const btn of canvasButtons) {
          const text = btn.textContent || btn.innerText || "";
          if (typeof buttonText === "string") {
            if (text.includes(buttonText)) {
              button = btn;
              break;
            }
          } else if (buttonText.test && buttonText.test(text)) {
            button = btn;
            break;
          }
        }
      }

      await expect(button).toBeTruthy();
      await expect(button).toBeInTheDocument();

      // Get the actual clickable element
      clickableButton = getClickableButton(button);
      if (!clickableButton) {
        clickableButton = button;
      }

      await expect(clickableButton).toBeTruthy();
    },
    { timeout },
  );

  return clickableButton;
}
