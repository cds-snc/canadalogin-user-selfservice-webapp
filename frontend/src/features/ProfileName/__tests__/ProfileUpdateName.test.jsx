import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import UpdateProfileName from "../components/ProfileUpdateName.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";
import "@testing-library/jest-dom/vitest";

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsButton: ({
    children,
    buttonId,
    onClick,
    disabled,
    buttonType,
    buttonRole,
    ...props
  }) => (
    <button
      data-testid={buttonId}
      onClick={onClick}
      disabled={disabled}
      data-button-type={buttonType}
      data-button-role={buttonRole}
      {...props}
    >
      {children}
    </button>
  ),
  GcdsText: ({ marginTop, marginBottom, children, ...props }) => (
    <p
      {...props}
      style={{
        marginTop: marginTop,
        marginBottom: marginBottom,
        ...props.style,
      }}
    >
      {children}
    </p>
  ),
  GcdsIcon: ({ name, size, className }) => (
    <div
      data-testid="warning-icon"
      data-icon-name={name}
      data-icon-size={size}
      className={className}
    />
  ),
  GcdsInput: ({ inputId, validateOn, label, lang, required, ...props }) => {
    const { name, type, value, onChange, ...domProps } = props;
    return (
      <input
        {...domProps}
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        data-testid={props["data-testid"]}
      />
    );
  },

  GcdsContainer: ({ children, marginTop, marginBottom, ...props }) => {
    const style = {
      ...(marginTop && { marginTop }),
      ...(marginBottom && { marginBottom }),
      ...props.style,
    };
    return (
      <div {...props} style={style}>
        {children}
      </div>
    );
  },
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ marginTop, marginBottom, children, ...props }) => (
    <h1
      {...props}
      style={{
        marginTop: marginTop,
        marginBottom: marginBottom,
        ...props.style,
      }}
    >
      {children}
    </h1>
  ),
  GcdsDetails: ({ children, ...props }) => (
    <details {...props}>{children}</details>
  ),
}));

vi.mock("../../../../utils/functions.jsx", () => ({
  getPageContent: () => ({
    1: "Are you sure you want to update your name?",
    2: "You’ve requested to update your name to:",
    3: "Example Newname",
    4: "This will update your name with the following services:",
    5: "GEO.ca",
    6: "Heads up",
    7: "This",
    8: "Yes, update",
    9: "Cancel",
    10: "Digital Talent",
    11: "does not",
    12: "legally change your name.",
  }),
}));

vi.mock(
  "../../../components/InfoBlocks/ServicesWithAccessInfoSection.jsx",
  () => ({
    default: () => (
      <div data-testid="services-with-access-info">
        <p>Mocked Services Info Section</p>
        <ul>
          <li>Test content for item 3</li>
        </ul>
      </div>
    ),
  }),
);

// Mock the navigation hook
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en" }),
  };
});

// Mock the navigate helper
const mockNavigateHelper = vi.fn();
vi.mock("useNavigate", () => ({
  navigate: () => mockNavigateHelper,
}));

// Mock the redirect function to prevent navigation errors
vi.mock("../../../utils/apiErrorHandler.js", () => ({
  redirectToLogin: vi.fn(),
  handleApiError: vi.fn(),
}));

const mockSessionTimeoutState = {
  showModal: false,
  isLoading: false,
  expirationTime: null,
  newServerSideExpirationTime: null,
};

const mockUpdateUserName = {
  firstName: "New",
  lastName: "User",
  formatted: "New User",
};

const mockUserState = {
  isLoading: false,
  loadingText: null,
  userData: {
    service: "Test Service",
    language: "en",
    email: "test@example.com",
    emailLanguage: null,
    emailValidated: true,
    trxnId: null,
    passwordSubmitted: false,
    phone: null,
    stepVerificationSent: false,
    stepVerified: false,
    viewPrivacy: false,
    id: "test-user-123",
    otpType: null,
    passwordValidated: false,
  },
  userProfile: {
    id: "test-user-123",
    active: true,
    details: {
      emailVerified: true,
      lastLogin: "2025-09-08T12:00:00Z",
      lastMFA: "2025-09-08T12:00:00Z",
      twoFactorAuthentication: true,
      pwdChangedTime: "2025-09-08T12:00:00Z",
    },
    emails: [{ value: "test@example.com", type: "primary" }],
    phoneNumbers: [{ value: "+1234567890", type: "primary" }],
    meta: {
      created: "2025-09-08T12:00:00Z",
      location: "test",
      lastModified: "2025-09-08T12:00:00Z",
      resourceType: "User",
    },
    userName: "testuser",
    preferredLanguage: "en",
    name: {
      givenName: "John",
      familyName: "Doe",
      formatted: "John Doe",
    },
  },
  editProfile: {
    id: "test-user-123",
    active: true,
    details: {
      emailVerified: true,
      lastLogin: "2025-09-08T12:00:00Z",
      lastMFA: "2025-09-08T12:00:00Z",
      twoFactorAuthentication: true,
      pwdChangedTime: "2025-09-08T12:00:00Z",
    },
    emails: [{ value: "test@example.com", type: "primary" }],
    phoneNumbers: [{ value: "+1234567890", type: "primary" }],
    meta: {
      created: "2025-09-08T12:00:00Z",
      location: "test",
      lastModified: "2025-09-08T12:00:00Z",
      resourceType: "User",
    },
    userName: "testuser",
    preferredLanguage: "en",
    name: {
      givenName: "Test",
      familyName: "User",
      formatted: "Test User",
    },
  },
  urlLanguageBeforeEdit: null,
  cancelProfileEditing: false,
  relyingPartyInfo: null,
  authenticatedPages: [],
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <UserProvider
      initial={mockUserState}
      initialSessionTimeoutState={mockSessionTimeoutState}
    >
      <LanguageProvider>{children}</LanguageProvider>
    </UserProvider>
  </BrowserRouter>
);

describe("UpdateProfileName Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigateHelper.mockClear();
  });

  it("updates local state when user types in inputs", () => {
    render(
      <BrowserRouter>
        <UpdateProfileName />
      </BrowserRouter>,
    );

    const firstNameInput = screen.getByTestId("givenName");
    const lastNameInput = screen.getByTestId("familyName");

    // Initially inputs should be empty
    expect(firstNameInput).toHaveValue("");
    expect(lastNameInput).toHaveValue("");

    // Simulate typing
    fireEvent.change(firstNameInput, {
      target: { name: "givenName", value: mockUpdateUserName.firstName },
    });
    fireEvent.change(lastNameInput, {
      target: { name: "familyName", value: mockUpdateUserName.lastName },
    });

    // Assert UI reflects updated state (which proves local state updated)
    expect(firstNameInput).toHaveValue(mockUpdateUserName.firstName);
    expect(lastNameInput).toHaveValue(mockUpdateUserName.lastName);
  });

  // it("clicking Continue button goes to confirmation page", async () => {
  //   render(
  //     <BrowserRouter>
  //       <LanguageProvider>
  //         <UserProvider
  //           initial={mockUserState}
  //           initialSessionTimeoutState={mockSessionTimeoutState}
  //         >
  //           <UpdateProfileName />
  //         </UserProvider>
  //       </LanguageProvider>
  //     </BrowserRouter>,
  //   );

  //   // Fill in the form with some data first
  //   const firstNameInput = screen.getByTestId("givenName");
  //   const lastNameInput = screen.getByTestId("familyName");

  //   // expect(firstNameInput.value).toBe(mockUpdateUserName.firstName);
  //   // expect(lastNameInput.value).toBe(mockUpdateUserName.lastName);

  //   fireEvent.change(firstNameInput, {
  //     target: { value: mockUpdateUserName.firstName },
  //   });
  //   fireEvent.change(lastNameInput, {
  //     target: { value: mockUpdateUserName.lastName },
  //   });

  //   // Find the form by its ID and trigger submit
  //   const form = document.getElementById("form");
  //   fireEvent.submit(form);

  //   // Verify it navigates to the confirmation page
  //   await waitFor(() => {
  //     expect(mockNavigateHelper).toHaveBeenCalledWith(
  //       "/en/profile/update-name/confirm-update",
  //       {
  //         state: {
  //           name: {
  //             givenName: mockUpdateUserName.firstName,
  //             familyName: mockUpdateUserName.lastName,
  //             formatted: mockUpdateUserName.formatted,
  //           },
  //         },
  //       },
  //     );
  //   });
  // });

  // it("updates local state state when form is submitted", async () => {
  //   // let capturedState;

  //   // // Create a component that captures the state for testing
  //   // const StateCapture = () => {
  //   //   const { state } = useUser();
  //   //   capturedState = state;
  //   //   return null;
  //   // };

  //   render(
  //     <BrowserRouter>
  //       <LanguageProvider>
  //         <UserProvider
  //           initial={mockUserState}
  //           initialSessionTimeoutState={mockSessionTimeoutState}
  //         >
  //           <UpdateProfileName />
  //         </UserProvider>
  //       </LanguageProvider>
  //     </BrowserRouter>,
  //   );

  //   // Wait for the component to mount and cloneUserProfile to be called
  //   // await waitFor(() => {
  //   //   expect(capturedState?.editProfile).toBeTruthy();
  //   // });

  //   // Fill in the form with new data
  //   const firstNameInput = screen.getByTestId("givenName");
  //   const lastNameInput = screen.getByTestId("familyName");
  //   const formattedNameInput = screen.getByTestId("New User");

  //   fireEvent.change(firstNameInput, {
  //     target: { name: "givenName", value: "New" },
  //   });
  //   fireEvent.change(lastNameInput, {
  //     target: { name: "familyName", value: "User" },
  //   });

  //   // Submit the form
  //   const form = document.getElementById("form");
  //   fireEvent.submit(form);

  //   // Verify navigation happens first
  //   await waitFor(() => {
  //     expect(mockNavigateHelper).toHaveBeenCalledWith(
  //       "/en/profile/update-name/confirm-update",
  //     );
  //   });

  //   expect(firstNameInput.value).toBe("New");
  //   expect(lastNameInput.value).toBe("User");
  //   expect(formattedNameInput.value).toBe("New User");
  // });

  it("matches snapshot", () => {
    const { container } = render(
      <TestWrapper>
        <UpdateProfileName />
      </TestWrapper>,
    );
    expect(container).toMatchSnapshot();
  });
});
