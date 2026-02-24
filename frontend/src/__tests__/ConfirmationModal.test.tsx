import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ConfirmationModal } from '../components/ConfirmationModal';

describe('ConfirmationModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        onConfirm: jest.fn(),
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed?',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- Visibility ---

    test('renders nothing when isOpen is false', () => {
        render(<ConfirmationModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });

    test('renders title and message when open', () => {
        render(<ConfirmationModal {...defaultProps} />);
        expect(screen.getByText('Confirm Action')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    // --- Buttons ---

    test('displays default Confirm and Cancel labels', () => {
        render(<ConfirmationModal {...defaultProps} />);
        expect(screen.getByText('Confirm')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('displays custom button labels', () => {
        render(
            <ConfirmationModal
                {...defaultProps}
                confirmLabel="Delete Now"
                cancelLabel="Go Back"
            />
        );
        expect(screen.getByText('Delete Now')).toBeInTheDocument();
        expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    // --- Actions ---

    test('calls onConfirm when confirm button is clicked', async () => {
        const user = userEvent.setup();
        render(<ConfirmationModal {...defaultProps} />);

        await user.click(screen.getByText('Confirm'));
        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<ConfirmationModal {...defaultProps} />);

        await user.click(screen.getByText('Cancel'));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when overlay is clicked', async () => {
        const user = userEvent.setup();
        const { container } = render(<ConfirmationModal {...defaultProps} />);

        const overlay = container.querySelector('.modal-overlay');
        if (overlay) await user.click(overlay);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    // --- Loading State ---

    test('disables buttons when isLoading is true', () => {
        render(<ConfirmationModal {...defaultProps} isLoading={true} />);

        expect(screen.getByText('Cancel')).toBeDisabled();
        expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    test('does not close on overlay click when loading', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <ConfirmationModal {...defaultProps} isLoading={true} />
        );

        const overlay = container.querySelector('.modal-overlay');
        if (overlay) await user.click(overlay);
        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    // --- Variants ---

    test('renders danger variant styling', () => {
        render(<ConfirmationModal {...defaultProps} variant="danger" />);
        // The danger icon circle should have bg-red-100
        const iconContainer = document.querySelector('.bg-red-100');
        expect(iconContainer).toBeInTheDocument();
    });

    test('renders warning variant styling', () => {
        render(<ConfirmationModal {...defaultProps} variant="warning" />);
        const iconContainer = document.querySelector('.bg-yellow-100');
        expect(iconContainer).toBeInTheDocument();
    });

    // --- Children ---

    test('renders children content (e.g., rejection reason textarea)', () => {
        render(
            <ConfirmationModal {...defaultProps}>
                <textarea data-testid="reason" placeholder="Enter reason" />
            </ConfirmationModal>
        );
        expect(screen.getByTestId('reason')).toBeInTheDocument();
    });
});
