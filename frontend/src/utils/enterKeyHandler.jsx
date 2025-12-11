/**
 * Creates a keyboard event handler for Enter key submissions
 * @param {Function} onSubmit - The function to call when Enter is pressed
 * @param {Function} onError - Optional error handler function
 * @returns {Function} The keyboard event handler
 */
export function createEnterKeyHandler(onSubmit, onError) {
  return async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      try {
        await onSubmit(event);
      } catch (error) {
        if (onError) {
          onError(error);
        } else {
          // Re-throw the error if no error handler is provided
          throw error;
        }
      }
    }
  };
}

/**
 * React hook for handling Enter key submissions
 * @param {Function} onSubmit - The function to call when Enter is pressed
 * @param {Function} onError - Optional error handler function
 * @returns {Function} The keyboard event handler
 */
export function useEnterKeySubmit(onSubmit, onError) {
  return createEnterKeyHandler(onSubmit, onError);
}
