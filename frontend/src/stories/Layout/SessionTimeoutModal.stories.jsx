import SessionTimeoutModal from "../../components/Layout/SessionTimeoutModal";

export default {
  title: "GC Sign In/Components/Layout/Session Timeout Modal",
  component: SessionTimeoutModal,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
The SessionTimeoutModal component displays a warning dialog when a user's session is about to expire due to inactivity.
It provides options to extend the session or sign out, and automatically manages favicon changes to alert the user.

**Key Features:**
- Responsive design (desktop/mobile layouts)
- Internationalization support (English/French)
- Favicon warning indicator
- Loading states during actions
- Accessibility compliant modal
        `,
      },
    },
  },
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Controls whether the modal is visible",
    },
    expirationTime: {
      control: "date",
      description: "The time when the session will expire",
    },
    currentLang: {
      control: { type: "select" },
      options: ["en", "fr", "en-ca", "fr-ca"],
      description: "Current language code",
    },
    isLoading: {
      control: "boolean",
      description: "Shows loading state on buttons",
    },
    onKeepSession: {
      action: "keep-session",
      description: "Callback when user chooses to keep session active",
    },
    onLogout: {
      action: "logout",
      description: "Callback when user chooses to sign out",
    },
  },
};

// Default story showing the modal open
export const Default = {
  args: {
    isOpen: true,
    expirationTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    currentLang: "en",
    isLoading: false,
  },
};

// Closed modal (shows nothing)
export const Closed = {
  args: {
    isOpen: false,
    expirationTime: new Date(Date.now() + 5 * 60 * 1000),
    currentLang: "en",
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "When isOpen is false, the modal renders nothing.",
      },
    },
  },
};

// Loading state
export const Loading = {
  args: {
    isOpen: true,
    expirationTime: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes from now
    currentLang: "en",
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state shows "Extending..." text and disables both buttons.',
      },
    },
  },
};

// French language
export const French = {
  args: {
    isOpen: true,
    expirationTime: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes from now
    currentLang: "fr",
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Modal content in French language.",
      },
    },
  },
};

// Different expiration times
export const ExpiringNow = {
  args: {
    isOpen: true,
    expirationTime: new Date(Date.now() + 30 * 1000), // 30 seconds from now
    currentLang: "en",
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Session expiring very soon (30 seconds).",
      },
    },
  },
};

export const ExpiringLater = {
  args: {
    isOpen: true,
    expirationTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    currentLang: "en",
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Session expiring later (15 minutes).",
      },
    },
  },
};

// Mobile viewport simulation
export const Mobile = {
  args: {
    isOpen: true,
    expirationTime: new Date(Date.now() + 5 * 60 * 1000),
    currentLang: "en",
    isLoading: false,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        story: "Modal appearance on mobile devices.",
      },
    },
  },
};

// Tablet viewport simulation
export const Tablet = {
  args: {
    isOpen: true,
    expirationTime: new Date(Date.now() + 5 * 60 * 1000),
    currentLang: "en",
    isLoading: false,
  },
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
    docs: {
      description: {
        story: "Modal appearance on tablet devices.",
      },
    },
  },
};
