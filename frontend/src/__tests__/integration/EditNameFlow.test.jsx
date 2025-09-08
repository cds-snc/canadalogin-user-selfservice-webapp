import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router';
import { Routes, Route } from 'react-router';
import ProfileNameEdit from '../../components/PersonalInfo/ProfileNameEdit.jsx';
import AreYouSureEditYourName from '../../components/Manage/AreYouSureEditYourName.jsx';
import ProfileYouMayUpdateName from '../../components/Manage/ProfileYouMayUpdateName.jsx';
import { UserProvider } from '../../components/Providers/UserProvider.tsx';
import { LanguageProvider } from '../../components/Providers/LanguageProvider.tsx';

// Mock the authService with successful update
const mockUpdateProfile = vi.fn(() => Promise.resolve({ 
    data: { 
        success: true,
        userProfile: {
            id: 'test-user-123',
            name: {
                givenName: 'Jane',
                familyName: 'Smith',
                formatted: 'Jane Smith'
            }
        }
    }
}));

vi.mock('../../services/authService.jsx', () => ({
    authService: {
        get_my_user_profile: vi.fn(() => Promise.resolve({ 
            data: {
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
            }
        })),
        update_my_user_profile: mockUpdateProfile
    }
}));

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
    editProfile: null,
    urlLanguageBeforeEdit: null,
    cancelProfileEditing: false,
    relyingPartyInfo: null,
    authenticatedPages: []
};

const EditNameFlow = ({ initialRoute = '/en/profile/update-name' }) => (
    <MemoryRouter initialEntries={[initialRoute]}>
        <UserProvider initial={mockUserState}>
            <LanguageProvider>
                <Routes>
                    <Route path="/en/profile/update-name" element={<ProfileNameEdit />} />
                    <Route path="/en/profile/update-name/confirm-update" element={<AreYouSureEditYourName />} />
                    <Route path="/en/profile/update-name/success" element={<ProfileYouMayUpdateName />} />
                </Routes>
            </LanguageProvider>
        </UserProvider>
    </MemoryRouter>
);

describe('Edit Name Flow Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('completes the full edit name flow successfully', async () => {
        render(<EditNameFlow />);

        // Step 1: Start on the edit name page
        expect(screen.getByText(/edit your name/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();

        // Step 2: Update the name
        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);
        const continueButton = screen.getByRole('button', { name: /continue/i });

        fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
        fireEvent.change(lastNameInput, { target: { value: 'Smith' } });

        // Step 3: Navigate to confirmation page
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText(/are you sure you want to edit your name/i)).toBeInTheDocument();
        });

        // Step 4: Verify the new name is shown
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();

        // Step 5: Confirm the change
        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        fireEvent.click(confirmButton);

        // Step 6: Verify success page
        await waitFor(() => {
            expect(screen.getByText(/name updated successfully/i)).toBeInTheDocument();
        });

        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(mockUpdateProfile).toHaveBeenCalledWith({
            name: {
                givenName: 'Jane',
                familyName: 'Smith',
                formatted: 'Jane Smith'
            }
        });
    });

    it('allows user to cancel from edit page', async () => {
        render(<EditNameFlow />);

        const cancelLink = screen.getByRole('link', { name: /cancel/i });
        expect(cancelLink.getAttribute('href')).toBe('/en/profile');
    });

    it('allows user to go back from confirmation page', async () => {
        render(<EditNameFlow initialRoute="/en/profile/update-name/confirm-update" />);

        const cancelLink = screen.getByRole('link', { name: /cancel/i });
        expect(cancelLink.getAttribute('href')).toBe('/en/profile/update-name');
    });

    it('handles validation errors on edit page', async () => {
        render(<EditNameFlow />);

        const firstNameInput = screen.getByLabelText(/first name/i);
        const continueButton = screen.getByRole('button', { name: /continue/i });

        // Clear required field
        fireEvent.change(firstNameInput, { target: { value: '' } });
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        });

        // Should still be on edit page
        expect(screen.getByText(/edit your name/i)).toBeInTheDocument();
    });

    it('handles API errors during profile update', async () => {
        // Mock API error
        mockUpdateProfile.mockRejectedValueOnce(new Error('Update failed'));

        render(<EditNameFlow />);

        // Go through the flow
        const firstNameInput = screen.getByLabelText(/first name/i);
        fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
        
        const continueButton = screen.getByRole('button', { name: /continue/i });
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText(/are you sure you want to edit your name/i)).toBeInTheDocument();
        });

        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        fireEvent.click(confirmButton);

        // Should show error message
        await waitFor(() => {
            expect(screen.getByText(/update failed/i)).toBeInTheDocument();
        });
    });

    it('preserves form data when navigating between pages', async () => {
        render(<EditNameFlow />);

        // Update name
        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);
        
        fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
        fireEvent.change(lastNameInput, { target: { value: 'Smith' } });

        // Go to confirmation
        const continueButton = screen.getByRole('button', { name: /continue/i });
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });

        // Go back to edit page
        const cancelLink = screen.getByRole('link', { name: /cancel/i });
        fireEvent.click(cancelLink);

        // Should preserve the entered values
        await waitFor(() => {
            expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
        });
    });
});
