import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';

// Mock dependencies
jest.mock('../services/api', () => ({
    __esModule: true,
    default: {
        login: jest.fn(),
    },
}));

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

const mockSetAuth = jest.fn();
jest.mock('../store/authStore', () => ({
    useAuthStore: (selector: (state: { setAuth: typeof mockSetAuth }) => typeof mockSetAuth) =>
        selector({ setAuth: mockSetAuth }),
}));

import api from '../services/api';
import toast from 'react-hot-toast';

function renderLogin() {
    return render(
        <BrowserRouter>
            <LoginPage />
        </BrowserRouter>
    );
}

describe('LoginPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- Rendering ---

    test('renders login form with email and password fields', () => {
        renderLogin();
        expect(screen.getByText('HR Management')).toBeInTheDocument();
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    test('renders sign in button', () => {
        renderLogin();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    test('renders sign up link', () => {
        renderLogin();
        expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    });

    test('renders demo credentials', () => {
        renderLogin();
        expect(screen.getByText(/demo login/i)).toBeInTheDocument();
        expect(screen.getByText(/admin@demo.com/i)).toBeInTheDocument();
    });

    // --- Validation ---

    test('submit button is disabled initially (form not valid)', () => {
        renderLogin();
        const submitBtn = screen.getByRole('button', { name: /sign in/i });
        expect(submitBtn).toBeDisabled();
    });

    test('shows error state on email field when invalid value entered', async () => {
        renderLogin();
        const emailInput = screen.getByLabelText(/email address/i);

        await act(async () => {
            fireEvent.change(emailInput, { target: { value: 'invalid' } });
        });

        // Wait for debounced validation (the form uses 300ms debounce)
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
        });

        await waitFor(() => {
            // The email field should be in error state (shown by aria-invalid)
            expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        });
    });

    test('shows error state on password field when too short', async () => {
        renderLogin();
        const passwordInput = screen.getByPlaceholderText('••••••••');

        await act(async () => {
            fireEvent.change(passwordInput, { target: { value: 'ab' } });
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
        });

        await waitFor(() => {
            expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
        });
    });

    test('error message element appears for invalid email', async () => {
        renderLogin();
        const emailInput = screen.getByLabelText(/email address/i);

        await act(async () => {
            fireEvent.change(emailInput, { target: { value: 'invalid' } });
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
        });

        await waitFor(() => {
            const errorDiv = document.getElementById('email-error');
            expect(errorDiv).toBeInTheDocument();
        });
    });

    // --- Form Structure ---

    test('email input has autocomplete attribute', () => {
        renderLogin();
        expect(screen.getByLabelText(/email address/i)).toHaveAttribute('autocomplete', 'email');
    });

    test('password input has autocomplete attribute', () => {
        renderLogin();
        expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('autocomplete', 'current-password');
    });

    test('has password visibility toggle button', () => {
        renderLogin();
        expect(screen.getByLabelText(/show password/i)).toBeInTheDocument();
    });
});
