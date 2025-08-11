
import React, { useEffect } from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter } from "react-router";

import { vi } from 'vitest';
import { useDispatch } from 'react-redux';
import App from '../App';
import { authService } from "../services/authService.jsx";
import { CONTEXT_ACTIONS } from '../utils/constants'; // Same here for the action type

import { UserProvider } from "../components/Providers/UserProvider";
import { LanguageProvider } from '../components/Providers/LanguageProvider';

import Header from '../components/Layout/Header';

const mockedUseUser = vi.fn();
vi.mock("../components/Providers/useUser.tsx", () => ({
    useUser: mockedUseUser
}));

const mockedUseLanguage = vi.fn();
vi.mock("../components/Providers/LanguageProvider.tsx", () => ({
    useLanguage: mockedUseLanguage
}));

const langHref = "/fr";
const currentLang = "en";

describe.only('RelyingPartyComponent', () => {
    it('should fetch and dispatch relying party info if available', async () => {
        const rpInfo = {
            url: 'https://example.com',
            linkName: 'Example Link',
            icon: 'https://example.com/icon.png',
            id: '12345'
        };

        mockedUseUser.mockReturnValue({
            state: {
                relyingPartyInfo: { ...rpInfo }
            },
        });

        const mockRpid = 'existing-rp-id';
        vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => mockRpid);

        const mockResponse = { data: { id: 'some-id' } };
        vi.spyOn(authService, 'get_rp_info').mockResolvedValue(mockResponse);

        // Mock dispatch function
        const mockDispatch = vi.fn();
        vi.mock('react-redux', () => ({
            useDispatch: () => mockDispatch,
        }));

        // Render the component
        const mockLanguageValue = { language: currentLang, setLang: vi.fn() };  // Mocked context value
        const mockUserValue = { state: { relyingPartyInfo: { ...rpInfo } } }; // Mock user value

        render(
            <MemoryRouter initialEntries={['/']}>
                <UserProvider value={mockUserValue}>
                    <LanguageProvider value={mockLanguageValue}>
                        <App />
                    </LanguageProvider>
                </UserProvider>
            </MemoryRouter>,


        );

        // Wait for the asynchronous effect to run
        await waitFor(() => {
            expect(authService.get_rp_info).toHaveBeenCalledWith(mockRpid);
            expect(mockDispatch).toHaveBeenCalledWith({
                type: CONTEXT_ACTIONS.set_relying_party_data,
                payload: mockResponse.data,
            });
        });

        // Ensure sessionStorage.setItem was called with the correct value
        expect(sessionStorage.setItem).toHaveBeenCalledWith('rp', mockRpid);

        // Check if the GcdsBreadcrumbsItem is rendered correctly
        const breadcrumbItem = screen.getByText(rpInfo.linkName);
        expect(breadcrumbItem).toBeInTheDocument();
        expect(breadcrumbItem.closest('a')).toHaveAttribute('href', rpInfo.url);
    });
});