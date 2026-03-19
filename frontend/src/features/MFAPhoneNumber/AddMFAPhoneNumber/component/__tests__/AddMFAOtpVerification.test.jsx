import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from "react-router";
import * as ReactRouter from "react-router";
import AddMFAOtpVerification from "../AddMFAOtpVerification";
import "@testing-library/jest-dom/vitest";

// Mock GCDS components to enable proper event handling and testing
vi.mock("@gcds-core/components-react", () => ({
  GcdsButton: ({ children, onGcdsClick, disabled, buttonRole, style }) => (
    <button
      onClick={onGcdsClick}
      disabled={disabled}
      data-button-role={buttonRole}
      style={style}
      data-testid={
        buttonRole === "secondary" ? "cancel-button" : "continue-button"
      }
    >
      {children}
    </button>
  ),
  GcdsContainer: ({ children }) => (
    <div data-testid="gcds-container">{children}</div>
  ),
  GcdsGrid: ({ children, columns, gap }) => (
    <div data-testid="gcds-grid" data-columns={columns} data-gap={gap}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, tag = "h1", lang }) => {
    const Component = tag;
    return (
      <Component lang={lang} data-testid="gcds-heading" data-tag={tag}>
        {children}
      </Component>
    );
  },
  GcdsText: ({ children, marginBottom, marginTop }) => (
    <div
      data-testid="gcds-text"
      data-margin-bottom={marginBottom}
      data-margin-top={marginTop}
    >
      {children}
    </div>
  ),
  GcdsInput: ({
    inputId,
    label,
    value,
    onGcdsInput,
    errorMessage,
    lang,
    size,
    maxlength,
    minlength,
    type,
    name,
    autocomplete,
    autofocus,
    validateOn,
  }) => (
    <div data-testid="gcds-input-wrapper">
      <label htmlFor={inputId} data-testid="gcds-input-label">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onGcdsInput}
        autoComplete={autocomplete}
        autoFocus={autofocus}
        maxLength={maxlength}
        minLength={minlength}
        size={size}
        lang={lang}
        data-testid="gcds-input"
        data-validate-on={validateOn}
      />
      {errorMessage && <div data-testid="gcds-input-error">{errorMessage}</div>}
    </div>
  ),
  GcdsLink: ({ children, onGcdsClick }) => (
    <button
      onClick={onGcdsClick}
      data-testid="gcds-link"
      style={{
        background: "none",
        border: "none",
        color: "blue",
        textDecoration: "underline",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  ),
  GcdsNotice: ({ children, type, noticeTitleTag, noticeTitle, ...props }) => (
    <div
      data-testid="gcds-notice"
      data-type={type}
      data-notice-title-tag={noticeTitleTag}
      {...props}
    >
      <div data-testid="gcds-notice-title">{noticeTitle}</div>
      <div data-testid="gcds-notice-content">{children}</div>
    </div>
  ),
}));

// Mock dependencies
vi.mock("../../../../../utils/functions", () => ({
  getPageContent: vi.fn((language, page) => {
    if (page === "Button") {
      if (language === "fr") {
        return {
          submit: "Continuer",
          cancel: "Annuler",
        };
      }
      return {
        submit: "Continue",
        cancel: "Cancel",
      };
    }

    if (page === "Error") {
      return {
        CSIAM0011E: "Invalid verification code. Please try again.",
        "002": "Verification code has expired. Please request a new one.",
        "003": "Too many failed attempts. Please try again later.",
      };
    }

    // verification page content - using actual JSON structure
    if (language === "fr") {
      return {
        1: "Consultez votre téléphone",
        2: "Nous avons envoyé un code de vérification à 6 chiffres au numéro suivant par le biais d'un message texte :",
        3: "Nous avons envoyé un code de vérification à 6 chiffres au numéro suivant par le biais d'un appel vocal :",
        4: "Votre message texte (SMS) pourrait mettre quelques minutes à vous parvenir.",
        5: "L'appel pourrait mettre quelques minutes à vous parvenir.",
        6: "Votre code expirera dans",
        7: "10 minutes.",
        8: "Entrez le code",
        9: "Code à 6 chiffres",
        10: "Des problèmes avec votre code?",
        14: "Vous pourrez demander un nouveau code dans",
        15: "secondes",
        16: "Demander un nouveau code",
        17: "Nous vous avons envoyé un nouveau code",
        21: "Utiliser un autre numéro de téléphone",
        24: "Le courriel pourrait prendre quelques minutes à arriver. Si vous ne voyez pas le courriel, vérifiez s'il se trouve dans votre dossier de pourriels.",
        26: "Demander un nouveau code",
      };
    }

    return {
      1: "Check your phone",
      2: "We have sent a text message with a 6-digit verification code to:",
      3: "We have sent a 6-digit verification code via voice call to:",
      4: "Your text (SMS) might take a few minutes to arrive.",
      5: "Your call might take a few minutes to arrive.",
      6: "Your code will expire in",
      7: "10 minutes.",
      8: "Enter the code",
      9: "6-digit code",
      10: "Problems with the code?",
      14: "Request a new code in",
      15: "seconds",
      16: "Request a new code",
      17: "We have sent you a new code",
      21: "Use a different phone number",
      24: "Your email might take a few minutes to arrive. If you do not get an email, check your spam folder.",
      26: "Send the code again",
    };
  }),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: vi.fn(() => ({ language: "en" })),
  };
});

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("AddMFAOtpVerification Unit Tests", () => {
  const mockOnNext = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnBack = vi.fn();
  const mockOnChangePhoneForm = vi.fn();
  const mockRequestNewOtpCode = vi.fn();
  const mockOnUseDifferentPhoneNumber = vi.fn();

  const defaultPhoneFormData = {
    phoneNumber: "+16135551234",
    formattedPhoneNumber: "(613) 555-1234",
    otpType: "smsotp",
    otp: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("Component Rendering", () => {
    it("should render the component without crashing", () => {
      act(() => {
        render(
          <TestWrapper>
            <AddMFAOtpVerification
              onNext={mockOnNext}
              onCancel={mockOnCancel}
              onBack={mockOnBack}
              onChangePhoneForm={mockOnChangePhoneForm}
              phoneFormData={defaultPhoneFormData}
              errorMessage=""
              requestNewOtpCode={mockRequestNewOtpCode}
              onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
            />
          </TestWrapper>,
        );
      });

      expect(screen.getByText("Enter the code")).toBeInTheDocument();
      expect(screen.getByText("Continue")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should render GCDS components", () => {
      act(() => {
        render(
          <TestWrapper>
            <AddMFAOtpVerification
              onNext={mockOnNext}
              onCancel={mockOnCancel}
              onBack={mockOnBack}
              onChangePhoneForm={mockOnChangePhoneForm}
              phoneFormData={defaultPhoneFormData}
              errorMessage=""
              requestNewOtpCode={mockRequestNewOtpCode}
              onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
            />
          </TestWrapper>,
        );
      });

      expect(screen.getAllByTestId("gcds-container")[0]).toBeInTheDocument();
      expect(screen.getByTestId("gcds-input")).toBeInTheDocument();
      expect(screen.getByTestId("continue-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    });

    it("should render verification input with correct attributes", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={defaultPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      const input = screen.getByTestId("gcds-input");
      expect(input).toHaveAttribute("id", "verificationCode");
      expect(input).toHaveAttribute("name", "verificationCode");
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("maxLength", "6");
      expect(input).toHaveAttribute("minLength", "6");
      expect(input).toHaveAttribute("autoComplete", "one-time-code");
    });
  });

  describe("Phone Number Display", () => {
    it("should display formatted phone number", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={defaultPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      expect(screen.getByText("(613) 555-1234")).toBeInTheDocument();
    });

    it("should show SMS-specific messaging for SMS OTP type", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={{ ...defaultPhoneFormData, otpType: "smsotp" }}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      expect(
        screen.getByText(
          "We have sent a text message with a 6-digit verification code to:",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Your text (SMS) might take a few minutes to arrive."),
      ).toBeInTheDocument();
    });

    it("should show voice-specific messaging for voice OTP type", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={{ ...defaultPhoneFormData, otpType: "voiceotp" }}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      expect(
        screen.getByText(
          "We have sent a 6-digit verification code via voice call to:",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Your call might take a few minutes to arrive."),
      ).toBeInTheDocument();
    });
  });

  describe("OTP Input Handling", () => {
    it("should call onChangePhoneForm when input value changes", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={defaultPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      const input = screen.getByTestId("gcds-input");

      // Simulate typing in the input
      act(() => {
        input.dispatchEvent(new Event("change", { bubbles: true }));
        Object.defineProperty(input, "value", {
          value: "123456",
          writable: true,
        });
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });

      // The handleChange function should be called
      expect(mockOnChangePhoneForm).toHaveBeenCalledWith("otp", "123456");
    });

    it("should display current OTP value in input", () => {
      const phoneFormDataWithOtp = {
        ...defaultPhoneFormData,
        otp: "123456",
      };

      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={phoneFormDataWithOtp}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      const input = screen.getByTestId("gcds-input");
      expect(input).toHaveValue("123456");
    });

    it("should clear OTP on component mount", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={defaultPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      expect(mockOnChangePhoneForm).toHaveBeenCalledWith("otp", "");
    });
  });

  describe("Button States and Actions", () => {
    it("should disable Continue button when OTP is less than 6 digits", () => {
      const phoneFormDataShortOtp = {
        ...defaultPhoneFormData,
        otp: "123",
      };

      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={phoneFormDataShortOtp}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      const continueButton = screen.getByTestId("continue-button");
      expect(continueButton).toBeDisabled();
    });

    it("should enable Continue button when OTP is 6 digits", () => {
      const phoneFormDataValidOtp = {
        ...defaultPhoneFormData,
        otp: "123456",
      };

      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={phoneFormDataValidOtp}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      const continueButton = screen.getByTestId("continue-button");
      expect(continueButton).not.toBeDisabled();
    });

    it("should call onNext when Continue button is clicked", () => {
      const phoneFormDataValidOtp = {
        ...defaultPhoneFormData,
        otp: "123456",
      };

      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={phoneFormDataValidOtp}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      const continueButton = screen.getByTestId("continue-button");
      continueButton.click();

      expect(mockOnNext).toHaveBeenCalled();
    });

    it("should call onCancel when Cancel button is clicked", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={defaultPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      const cancelButton = screen.getByTestId("cancel-button");
      cancelButton.click();

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("Different Phone Number Link", () => {
    it("should call clearValues, onUseDifferentPhoneNumber, and onBack when clicked", async () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={defaultPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      const differentPhoneLink = screen.getByText(
        "Use a different phone number",
      );

      await act(async () => {
        differentPhoneLink.click();
      });

      // Should clear all form values
      expect(mockOnChangePhoneForm).toHaveBeenCalledWith("phoneNumber", "");
      expect(mockOnChangePhoneForm).toHaveBeenCalledWith(
        "formattedPhoneNumber",
        "",
      );
      expect(mockOnChangePhoneForm).toHaveBeenCalledWith("otp", "");

      expect(mockOnUseDifferentPhoneNumber).toHaveBeenCalled();
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should display error message when errorMessage is provided", () => {
      act(() => {
        render(
          <TestWrapper>
            <AddMFAOtpVerification
              onNext={mockOnNext}
              onCancel={mockOnCancel}
              onBack={mockOnBack}
              onChangePhoneForm={mockOnChangePhoneForm}
              phoneFormData={defaultPhoneFormData}
              errorMessage="Invalid verification code. Please try again."
              requestNewOtpCode={mockRequestNewOtpCode}
              onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
            />
          </TestWrapper>,
        );
      });

      expect(screen.getByTestId("gcds-input-error")).toBeInTheDocument();
      expect(
        screen.getByText("Invalid verification code. Please try again."),
      ).toBeInTheDocument();
    });

    it("should not display error message when errorMessage is empty", () => {
      act(() => {
        render(
          <TestWrapper>
            <AddMFAOtpVerification
              onNext={mockOnNext}
              onCancel={mockOnCancel}
              onBack={mockOnBack}
              onChangePhoneForm={mockOnChangePhoneForm}
              phoneFormData={defaultPhoneFormData}
              errorMessage=""
              requestNewOtpCode={mockRequestNewOtpCode}
              onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
            />
          </TestWrapper>,
        );
      });

      expect(screen.queryByTestId("gcds-input-error")).not.toBeInTheDocument();
    });
  });

  describe("French Language Support", () => {
    beforeEach(() => {
      vi.mocked(ReactRouter.useParams).mockReturnValue({ language: "fr" });
    });

    afterEach(() => {
      vi.mocked(ReactRouter.useParams).mockReturnValue({ language: "en" });
    });

    it("should render French content when language is 'fr'", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={defaultPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      expect(screen.getByText("Entrez le code")).toBeInTheDocument();
      expect(screen.getByText("Continuer")).toBeInTheDocument();
      expect(screen.getByText("Annuler")).toBeInTheDocument();
    });

    it("should render French SMS messaging", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={{ ...defaultPhoneFormData, otpType: "smsotp" }}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      expect(
        screen.getByText(
          "Nous avons envoyé un code de vérification à 6 chiffres au numéro suivant par le biais d'un message texte :",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("OTP Type Variations", () => {
    it("should handle email OTP type messaging", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={{ ...defaultPhoneFormData, otpType: "email" }}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      expect(
        screen.getByText(
          "Your email might take a few minutes to arrive. If you do not get an email, check your spam folder.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("should handle complete user flow", async () => {
      const { rerender } = render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={defaultPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      // Initially, continue button should be disabled
      expect(screen.getByTestId("continue-button")).toBeDisabled();

      // Simulate user entering OTP
      const updatedPhoneFormData = { ...defaultPhoneFormData, otp: "123456" };

      rerender(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={updatedPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      // Continue button should now be enabled
      expect(screen.getByTestId("continue-button")).not.toBeDisabled();

      // User clicks continue
      screen.getByTestId("continue-button").click();
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe("Accessibility and UX", () => {
    it("should have proper heading hierarchy", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={defaultPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      const h1Headings = screen
        .getAllByTestId("gcds-heading")
        .filter((heading) => heading.getAttribute("data-tag") === "h1");
      const h2Headings = screen
        .getAllByTestId("gcds-heading")
        .filter((heading) => heading.getAttribute("data-tag") === "h2");

      expect(h1Headings).toHaveLength(1);
      expect(h2Headings.length).toBeGreaterThan(0);
    });

    it("should have proper button styling", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={defaultPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      const continueButton = screen.getByTestId("continue-button");
      const cancelButton = screen.getByTestId("cancel-button");

      expect(continueButton.style.width).toBe("fit-content");
      expect(cancelButton.style.width).toBe("fit-content");
      expect(cancelButton).toHaveAttribute("data-button-role", "secondary");
    });

    it("should handle grid layout for buttons", () => {
      render(
        <TestWrapper>
          <AddMFAOtpVerification
            onNext={mockOnNext}
            onCancel={mockOnCancel}
            onBack={mockOnBack}
            onChangePhoneForm={mockOnChangePhoneForm}
            phoneFormData={defaultPhoneFormData}
            errorMessage=""
            requestNewOtpCode={mockRequestNewOtpCode}
            onUseDifferentPhoneNumber={mockOnUseDifferentPhoneNumber}
          />
        </TestWrapper>,
      );

      const grid = screen.getByTestId("gcds-grid");
      expect(grid).toHaveAttribute("data-columns", "max-content max-content");
      expect(grid).toHaveAttribute("data-gap", "200");
    });
  });
});
