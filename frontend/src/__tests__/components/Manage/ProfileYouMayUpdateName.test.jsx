import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router';
import ProfileYouMayUpdateName from '../../../components/Manage/ProfileYouMayUpdateName.jsx';
import { UserProvider } from '../../../components/Providers/UserProvider.tsx';
import { LanguageProvider } from '../../../components/Providers/LanguageProvider.tsx';
import { LanguageProvider } from '../../components/Providers/LanguageProvider.tsx';

// Mock the navigation hook
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router');
    return {
        ...actual,
        useParams: () => ({ language: 'en' })
    };
});

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
            givenName: 'Jane',
            familyName: 'Smith',
            formatted: 'Jane Smith'
        }
    },
    editProfile: null,
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

describe('ProfileYouMayUpdateName Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the success page', () => {
        render(
            <TestWrapper>
                <ProfileYouMayUpdateName />
            </TestWrapper>
        );

        expect(screen.getByText(/name updated successfully/i)).toBeInTheDocument();
    });

    it('displays the updated name', () => {
        render(
            <TestWrapper>
                <ProfileYouMayUpdateName />
            </TestWrapper>
        );

        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('shows continue to profile button', () => {
        render(
            <TestWrapper>
                <ProfileYouMayUpdateName />
            </TestWrapper>
        );

        const continueButton = screen.getByRole('link', { name: /continue to profile/i });
        expect(continueButton).toBeInTheDocument();
        expect(continueButton.getAttribute('href')).toBe('/en/profile');
    });

    it('displays information about updating name elsewhere', () => {
        render(
            <TestWrapper>
                <ProfileYouMayUpdateName />
            </TestWrapper>
        );

        expect(screen.getByText(/you may need to update your name in other places/i)).toBeInTheDocument();
    });

    it('shows success icon or indicator', () => {
        render(
            <TestWrapper>
                <ProfileYouMayUpdateName />
            </TestWrapper>
        );

        // Check for success notice or similar component
        const successElement = screen.getByRole('alert') || 
                             screen.getByText(/success/i) ||
                             screen.querySelector('[data-testid="success-icon"]');
        
        expect(successElement).toBeInTheDocument();
    });

    it('provides guidance about next steps', () => {
        render(
            <TestWrapper>
                <ProfileYouMayUpdateName />
            </TestWrapper>
        );

        expect(screen.getByText(/what happens next/i)).toBeInTheDocument();
    });
});
