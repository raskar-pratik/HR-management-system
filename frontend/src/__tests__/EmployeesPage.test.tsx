import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import EmployeesPage from '../pages/employees/EmployeesPage';

// Mock API
jest.mock('../services/api', () => ({
    __esModule: true,
    default: {
        getEmployees: jest.fn(),
        deleteEmployee: jest.fn(),
        createEmployee: jest.fn(),
    },
}));

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock('../store/authStore', () => ({
    useAuthStore: (selector: (state: { user: { role: string } }) => { role: string }) =>
        selector({ user: { role: 'company_admin' } }),
}));

import api from '../services/api';
import toast from 'react-hot-toast';

const mockEmployees = [
    {
        id: '1',
        employeeCode: 'EMP001',
        employmentStatus: 'active',
        user: { firstName: 'John', lastName: 'Doe', email: 'john@demo.com' },
        department: { name: 'Engineering' },
        designation: { name: 'Developer' },
    },
    {
        id: '2',
        employeeCode: 'EMP002',
        employmentStatus: 'active',
        user: { firstName: 'Jane', lastName: 'Smith', email: 'jane@demo.com' },
        department: { name: 'HR' },
        designation: { name: 'Manager' },
    },
];

function renderPage() {
    return render(
        <BrowserRouter>
            <EmployeesPage />
        </BrowserRouter>
    );
}

describe('EmployeesPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (api.getEmployees as jest.Mock).mockResolvedValue({
            data: { employees: mockEmployees, total: 2 },
        });
    });

    // --- List Rendering ---

    test('renders employee list on load', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });
    });

    test('displays employee codes', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('EMP001')).toBeInTheDocument();
            expect(screen.getByText('EMP002')).toBeInTheDocument();
        });
    });

    test('displays department names', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Engineering')).toBeInTheDocument();
            expect(screen.getByText('HR')).toBeInTheDocument();
        });
    });

    // --- Empty State ---

    test('shows empty state when no employees exist', async () => {
        (api.getEmployees as jest.Mock).mockResolvedValue({
            data: { employees: [], total: 0 },
        });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No employees found')).toBeInTheDocument();
        });
    });

    // --- Search ---

    test('calls API with search query when user types', async () => {
        const user = userEvent.setup();
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/search employees/i);
        await user.type(searchInput, 'John');

        await waitFor(() => {
            expect(api.getEmployees).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'John' })
            );
        });
    });

    // --- Header ---

    test('renders page header with total count', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Employees')).toBeInTheDocument();
            expect(screen.getByText(/2 total employees/i)).toBeInTheDocument();
        });
    });

    test('renders Add Employee button', async () => {
        renderPage();
        expect(screen.getByText(/add employee/i)).toBeInTheDocument();
    });

    // --- Add Employee Modal ---

    test('opens add employee modal on button click', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByText(/add employee/i));

        await waitFor(() => {
            expect(screen.getByText('Add New Employee')).toBeInTheDocument();
        });
    });

    // --- Delete Confirmation ---

    test('opens confirmation modal when delete button is clicked', async () => {
        const user = userEvent.setup();
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle('Delete');
        await user.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Deactivate Employee')).toBeInTheDocument();
        });
    });

    // --- Error Handling ---

    test('shows error toast when API call fails', async () => {
        (api.getEmployees as jest.Mock).mockRejectedValue(new Error('Network error'));

        renderPage();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                'Failed to load employees'
            );
        });
    });
});
