import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router';
import AreYouSureEditYourName from '../../../components/Manage/AreYouSureEditYourName.jsx';
import { UserProvider } from '../../../components/Providers/UserProvider.tsx';
import { LanguageProvider } from '../../../components/Providers/LanguageProvider.tsx';

// Mock the navigation hook
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ language: 'en' })
    };
});

// Mock the submit hook
const mockHandleSubmit = vi.fn();
const mockIsPending = false;

vi.mock('../../hooks/useSubmit', () => ({
    useSubmit: () => ({
        handleSubmit: mockHandleSubmit,
        isPending: mockIsPending
    })
}));

// Mock the user hooks
const mockDispatch = vi.fn();
const mockUserState = {
    isLoading: false,
    userData: {
        service: 'Test Service',
        language: 'en',
        email: 'test@example.com',
        emailLanguage: null,
        emailValidated: true,
        trxnId: null,
        passwordSubmitted: false,
        phone: null,
        stepVerificationSent: false,
        stepVerified: false,
        viewPrivacy: false,
        id: 'test-user-123',
        otpType: null,
        passwordValidated: false
    },
    userProfile: {
        id: 'test-user-123',
        active: true,
        details: {
            emailVerified: true,
            lastLogin: '2025-09-08T12:00:00Z',
            lastMFA: '2025-09-08T12:00:00Z',
            twoFactorAuthentication: true,
            pwdChangedTime: '2025-09-08T12:00:00Z'
        },
        emails: [{ value: 'test@example.com', type: 'primary' }],
        phoneNumbers: [{ value: '+1234567890', type: 'primary' }],
        meta: {
            created: '2025-09-08T12:00:00Z',
            location: 'test',
            lastModified: '2025-09-08T12:00:00Z',
            resourceType: 'User'
        },
        userName: 'testuser',
        preferredLanguage: 'en',
        name: {
            givenName: 'John',
            familyName: 'Doe',
            formatted: 'John Doe'
        }
    },
    editProfile: {
        id: 'test-user-123',
        active: true,
        details: {
            emailVerified: true,
            lastLogin: '2025-09-08T12:00:00Z',
            lastMFA: '2025-09-08T12:00:00Z',
            twoFactorAuthentication: true,
            pwdChangedTime: '2025-09-08T12:00:00Z'
        },
        emails: [{ value: 'test@example.com', type: 'primary' }],
        phoneNumbers: [{ value: '+1234567890', type: 'primary' }],
        meta: {
            created: '2025-09-08T12:00:00Z',
            location: 'test',
            lastModified: '2025-09-08T12:00:00Z',
            resourceType: 'User'
        },
        userName: 'testuser',
        preferredLanguage: 'en',
        name: {
            givenName: 'Jane',
            familyName: 'Smith',
            formatted: 'Jane Smith'
        }
    },
    urlLanguageBeforeEdit: null,
    cancelProfileEditing: false,
    relyingPartyInfo: null,
    authenticatedPages: []
};

vi.mock('../../components/Providers/useUser.tsx', () => ({
    useUser: () => ({
        state: mockUserState,
        dispatch: mockDispatch
    })
}));

// Mock the authService
vi.mock('../../services/authService.jsx', () => ({
    authService: {
        get_my_user_profile: vi.fn(() => Promise.resolve({ data: mockUserState.userProfile }))
    }
}));

const TestWrapper = ({ children }) => (
    <BrowserRouter>
        <UserProvider initial={mockUserState}>
            <LanguageProvider>
                {children}
            </LanguageProvider>
        </UserProvider>
    </BrowserRouter>
);

describe('AreYouSureEditYourName Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the confirmation page', () => {
        render(
            <TestWrapper>
                <AreYouSureEditYourName />
            </TestWrapper>
        );

        expect(screen.getByText(/are you sure you want to edit your name/i)).toBeInTheDocument();
        expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    });

    it('displays the new name from edit profile', () => {
        render(
            <TestWrapper>
                <AreYouSureEditYourName />
            </TestWrapper>
        );

        // Should show the new name from editProfile
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('shows current name from user profile', () => {
        render(
            <TestWrapper>
                <AreYouSureEditYourName />
            </TestWrapper>
        );

        // Should show current name for comparison
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('has confirm and cancel buttons', () => {
        render(
            <TestWrapper>
                <AreYouSureEditYourName />
            </TestWrapper>
        );

        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls handleSubmit when confirm button is clicked', async () => {
        render(
            <TestWrapper>
                <AreYouSureEditYourName />
            </TestWrapper>
        );

        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        fireEvent.click(confirmButton);

        expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('cancel link navigates back to edit page', () => {
        render(
            <TestWrapper>
                <AreYouSureEditYourName />
            </TestWrapper>
        );

        const cancelLink = screen.getByRole('link', { name: /cancel/i });
        expect(cancelLink.getAttribute('href')).toBe('/en/profile/update-name');
    });

    it('displays warning about updating name in other places', () => {
        render(
            <TestWrapper>
                <AreYouSureEditYourName />
            </TestWrapper>
        );

        expect(screen.getByText(/you may need to update your name/i)).toBeInTheDocument();
    });

    it('shows loading state when pending', () => {
        // Mock pending state
        vi.mocked(mockIsPending).mockReturnValue(true);
        
        render(
            <TestWrapper>
                <AreYouSureEditYourName />
            </TestWrapper>
        );

        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        expect(confirmButton).toBeDisabled();
    });
});
