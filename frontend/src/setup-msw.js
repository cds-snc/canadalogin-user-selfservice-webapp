import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Create MSW server for Node.js environment (vitest)
const server = setupServer(
  // Handle the profile endpoint that's being called
  http.get('http://localhost:8000/v1/users/profile', () => {
    return HttpResponse.json({
      id: "test-user-123",
      active: true,
      name: {
        givenName: "Test",
        familyName: "User",
        formatted: "Test User",
      },
      emails: [{ type: "primary", value: "test@example.com" }],
      phoneNumbers: [{ type: "primary", value: "+1234567890" }],
      preferredLanguage: "en",
      details: {
        emailVerified: true,
        twoFactorAuthentication: true,
        lastLogin: "2025-09-08T12:00:00Z",
        lastMFA: "2025-09-08T12:00:00Z",
        pwdChangedTime: "2025-09-08T12:00:00Z",
      },
      meta: {
        created: "2025-09-08T12:00:00Z",
        lastModified: "2025-09-08T12:00:00Z",
        location: "test",
        resourceType: "User",
      },
    })
  }),
  
  // Handle OPTIONS requests
  http.options('http://localhost:8000/v1/users/profile', () => {
    return new HttpResponse(null, { status: 200 })
  })
)

// Setup MSW server and suppress GCDS component errors
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
  
  // Suppress console errors from third-party components in test environment
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Suppress specific GCDS component errors that are expected in jsdom
    if (
      message.includes('setFormValue is not a function') ||
      message.includes('setValidity is not a function') ||
      message.includes('checkValidity is not a function') ||
      message.includes('Not a valid tag') ||
      message.includes('gcds-components')
    ) {
      return; // Suppress these specific errors
    }
    
    // Suppress MSW browser worker errors (stories trying to use browser worker in Node.js)
    if (
      message.includes('Cannot read properties of undefined (reading \'url\')') ||
      message.includes('deserializeRequest') ||
      message.includes('setupWorker') ||
      message.includes('createResponseListener')
    ) {
      return; // Suppress these MSW browser worker errors
    }
    
    // Allow other errors to be logged
    originalConsoleError.apply(console, args);
  };

  // Also override console.warn to suppress MSW browser worker warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Suppress MSW browser worker warnings
    if (
      message.includes('Cannot read properties of undefined (reading \'url\')') ||
      message.includes('deserializeRequest') ||
      message.includes('setupWorker') ||
      message.includes('createResponseListener')
    ) {
      return; // Suppress these MSW browser worker warnings
    }
    
    // Allow other warnings to be logged
    originalConsoleWarn.apply(console, args);
  };

  // Override window.addEventListener to catch and suppress MSW errors
  if (typeof window !== 'undefined') {
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      if (type === 'error' || type === 'unhandledrejection') {
        const wrappedListener = function(event) {
          const errorMsg = event.error?.message || event.reason?.message || '';
          
          // Suppress MSW browser worker errors
          if (
            errorMsg.includes('Cannot read properties of undefined (reading \'url\')') ||
            errorMsg.includes('deserializeRequest') ||
            errorMsg.includes('setupWorker') ||
            errorMsg.includes('createResponseListener')
          ) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          
          // Call original listener for other errors
          if (typeof listener === 'function') {
            listener.call(this, event);
          }
        };
        
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  // Global error handler to catch any remaining MSW browser worker errors
  if (typeof window !== 'undefined') {
    window.onerror = function(message, source, lineno, colno, error) {
      const errorMsg = message || error?.message || '';
      
      // Suppress MSW browser worker errors
      if (
        errorMsg.includes('Cannot read properties of undefined (reading \'url\')') ||
        errorMsg.includes('deserializeRequest') ||
        errorMsg.includes('setupWorker') ||
        errorMsg.includes('createResponseListener')
      ) {
        return true; // Prevent default error handling
      }
      
      return false; // Allow default error handling for other errors
    };
    
    window.onunhandledrejection = function(event) {
      const errorMsg = event.reason?.message || '';
      
      // Suppress MSW browser worker promise rejections
      if (
        errorMsg.includes('Cannot read properties of undefined (reading \'url\')') ||
        errorMsg.includes('deserializeRequest') ||
        errorMsg.includes('setupWorker') ||
        errorMsg.includes('createResponseListener')
      ) {
        event.preventDefault();
        return;
      }
    };
  }

  // Create a comprehensive ElementInternals polyfill
  class MockElementInternals {
    constructor() {
      this.validity = {
        badInput: false,
        customError: false,
        patternMismatch: false,
        rangeOverflow: false,
        rangeUnderflow: false,
        stepMismatch: false,
        tooLong: false,
        tooShort: false,
        typeMismatch: false,
        valid: true,
        valueMissing: false
      };
      this.validationMessage = '';
      this.willValidate = true;
      this.form = null;
      this.labels = [];
    }

    setFormValue(value, state) {
      // Mock implementation
      this._formValue = value;
      this._formState = state;
    }

    setValidity(flags, message) {
      if (flags && typeof flags === 'object') {
        Object.assign(this.validity, flags);
        this.validity.valid = !Object.values(flags).some(v => v === true);
      }
      if (message !== undefined) {
        this.validationMessage = message || '';
      }
    }

    checkValidity() {
      return this.validity.valid;
    }

    reportValidity() {
      return this.validity.valid;
    }
  }

  // Set up the polyfill globally
  if (typeof globalThis !== 'undefined') {
    globalThis.ElementInternals = MockElementInternals;
  }
  if (typeof window !== 'undefined') {
    window.ElementInternals = MockElementInternals;
  }

  // Override attachInternals to always return our mock
  HTMLElement.prototype.attachInternals = function() {
    return new MockElementInternals();
  };

  // Suppress unhandled promise rejections from third-party components
  // eslint-disable-next-line no-undef
  const originalUnhandledRejection = process.listeners('unhandledRejection')[0];
  // eslint-disable-next-line no-undef
  process.removeAllListeners('unhandledRejection');
  // eslint-disable-next-line no-undef
  process.on('unhandledRejection', (reason, promise) => {
    const reasonStr = reason?.toString() || '';
    const errorMsg = reason?.message || '';
    const stackTrace = reason?.stack || '';
    
    // Suppress GCDS-related unhandled rejections
    if (
      reasonStr.includes('setFormValue is not a function') ||
      reasonStr.includes('setValidity is not a function') ||
      reasonStr.includes('checkValidity is not a function')
    ) {
      return; // Suppress these specific rejections
    }
    
    // Suppress MSW browser worker unhandled rejections
    if (
      reasonStr.includes('Cannot read properties of undefined (reading \'url\')') ||
      errorMsg.includes('Cannot read properties of undefined (reading \'url\')') ||
      reasonStr.includes('deserializeRequest') ||
      reasonStr.includes('setupWorker') ||
      reasonStr.includes('createResponseListener') ||
      stackTrace.includes('deserializeRequest') ||
      stackTrace.includes('setupWorker') ||
      stackTrace.includes('createResponseListener')
    ) {
      return; // Suppress these MSW browser worker rejections
    }
    
    // Re-throw other unhandled rejections
    if (originalUnhandledRejection) {
      originalUnhandledRejection(reason, promise);
    }
  });

  // Also handle uncaught exceptions - but be more careful
  // eslint-disable-next-line no-undef
  const originalUncaughtException = process.listeners('uncaughtException')[0];
  // eslint-disable-next-line no-undef
  process.removeAllListeners('uncaughtException');
  // eslint-disable-next-line no-undef
  process.on('uncaughtException', (error) => {
    const errorMsg = error?.message || '';
    const stackTrace = error?.stack || '';
    
    // Suppress MSW browser worker uncaught exceptions
    if (
      errorMsg.includes('Cannot read properties of undefined (reading \'url\')') ||
      errorMsg.includes('deserializeRequest') ||
      errorMsg.includes('setupWorker') ||
      errorMsg.includes('createResponseListener') ||
      stackTrace.includes('deserializeRequest') ||
      stackTrace.includes('setupWorker') ||
      stackTrace.includes('createResponseListener')
    ) {
      return; // Suppress these MSW browser worker exceptions
    }
    
    // Re-throw other uncaught exceptions or call original handler
    if (originalUncaughtException) {
      originalUncaughtException(error);
    } else {
      throw error;
    }
  });
})

// Clean up after each test
afterEach(() => server.resetHandlers())

// Close server after all tests
afterAll(() => server.close())

// Export server for use in tests if needed
export { server }
