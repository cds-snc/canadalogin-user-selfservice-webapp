/**
 * Waits for a GCDS component to be fully rendered and ready for interaction
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string} selector - The GCDS component selector (e.g., 'gcds-button', 'gcds-heading')
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<HTMLElement>} The found GCDS element
 */
export function waitForGcdsComponent(canvasElement: HTMLElement, selector: string, timeout?: number): Promise<HTMLElement>;
/**
 * Waits for multiple GCDS components to be rendered
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string} selector - The GCDS component selector
 * @param {number} expectedCount - Expected number of elements (minimum)
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<NodeList>} The found GCDS elements
 */
export function waitForGcdsComponents(canvasElement: HTMLElement, selector: string, expectedCount?: number, timeout?: number): Promise<NodeList>;
/**
 * Finds a GCDS button by role and waits for it to be interactive
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string} role - The button role ('danger', 'secondary', 'primary')
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<HTMLElement>} The found button element (shadow DOM or GCDS element)
 */
export function waitForGcdsButton(canvasElement: HTMLElement, role: string, timeout?: number): Promise<HTMLElement>;
/**
 * Gets the actual clickable button element from a GCDS button (handling shadow DOM)
 * @param {HTMLElement} gcdsButton - The GCDS button element
 * @returns {HTMLElement|null} The actual button element or null if not found
 */
export function getClickableButton(gcdsButton: HTMLElement): HTMLElement | null;
/**
 * Waits for text content to appear in the component
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string|RegExp} textPattern - Text or regex pattern to search for
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<boolean>} True if text is found
 */
export function waitForTextContent(canvasElement: HTMLElement, textPattern: string | RegExp, timeout?: number): Promise<boolean>;
/**
 * Waits for a phone number to be displayed (handles multiple formats)
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string} phoneNumber - The phone number to look for (any format)
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<boolean>} True if phone number is found
 */
export function waitForPhoneNumber(canvasElement: HTMLElement, phoneNumber: string, timeout?: number): Promise<boolean>;
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
export function waitForComponentReady(canvasElement: HTMLElement, options?: {
    expectHeading: boolean;
    expectButtons: boolean;
    expectedButtonCount: number;
}, timeout?: number): Promise<any>;
/**
 * Waits for a GCDS notice component to be rendered and validates its structure
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {Object} options - Configuration options
 * @param {boolean} options.expectText - Whether to wait for gcds-text elements (default: true)
 * @param {number} options.minTextCount - Minimum number of gcds-text elements expected (default: 1)
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<Object>} Object containing found notice and text elements
 */
export function waitForGcdsNotice(canvasElement: HTMLElement, options?: {
    expectText: boolean;
    minTextCount: number;
}, timeout?: number): Promise<any>;
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
export function waitForModal(options?: {
    canvasElement: HTMLElement;
    expectButtons: boolean;
    minButtonCount: number;
    shouldExist: boolean;
}, timeout?: number): Promise<any>;
/**
 * Waits for a GCDS input to be ready and returns the actual input element
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string} testId - The data-testid of the GCDS input
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<HTMLElement>} The actual input element inside shadow DOM
 */
export function waitForGcdsInput(canvasElement: HTMLElement, testId: string, timeout?: number): Promise<HTMLElement>;
/**
 * Waits for a button by text content to be clickable
 * @param {HTMLElement} canvasElement - The canvas element to search within
 * @param {string|RegExp} buttonText - Text content of the button to find
 * @param {number} timeout - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<HTMLElement>} The clickable button element
 */
export function waitForButtonByText(canvasElement: HTMLElement, buttonText: string | RegExp, timeout?: number): Promise<HTMLElement>;
/**
 * Default timeout for waitFor operations (in milliseconds)
 */
export const DEFAULT_TIMEOUT: 5000;
