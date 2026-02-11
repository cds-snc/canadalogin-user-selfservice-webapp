import { vi } from "vitest";

// Mock window.matchMedia for useBreakpoints hook
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Global axios mock to prevent network calls from stories/components
vi.mock("axios", () => {
  const m = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    create: function () {
      return m;
    },
    defaults: { headers: {} },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };
  return { default: m, __esModule: true };
});

// Mock Storybook actions addon so stories using `action()` don't fail in tests
vi.mock("@storybook/addon-actions", () => ({ action: () => vi.fn() }));
