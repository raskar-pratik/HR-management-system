import '@testing-library/jest-dom';
import { showToast } from '../utils/toast';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => {
    const mockToast = jest.fn() as jest.Mock & {
        success: jest.Mock;
        error: jest.Mock;
        promise: jest.Mock;
        dismiss: jest.Mock;
    };
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
    mockToast.promise = jest.fn();
    mockToast.dismiss = jest.fn();
    return {
        __esModule: true,
        default: mockToast,
    };
});

import toast from 'react-hot-toast';

describe('showToast utility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('success calls toast.success', () => {
        showToast.success('Employee created');
        expect(toast.success).toHaveBeenCalledWith('Employee created');
    });

    test('error calls toast.error', () => {
        showToast.error('Failed to save');
        expect(toast.error).toHaveBeenCalledWith('Failed to save');
    });

    test('warning calls toast with yellow styling', () => {
        showToast.warning('Session expiring');
        expect(toast).toHaveBeenCalledWith('Session expiring', expect.objectContaining({
            icon: '⚠️',
            style: expect.objectContaining({ background: '#f59e0b' }),
        }));
    });

    test('info calls toast with blue styling', () => {
        showToast.info('Changes saved automatically');
        expect(toast).toHaveBeenCalledWith('Changes saved automatically', expect.objectContaining({
            icon: 'ℹ️',
            style: expect.objectContaining({ background: '#3b82f6' }),
        }));
    });

    test('promise delegates to toast.promise', () => {
        const p = Promise.resolve('done');
        const msgs = { loading: 'Saving...', success: 'Saved!', error: 'Failed' };
        showToast.promise(p, msgs);
        expect(toast.promise).toHaveBeenCalledWith(p, msgs);
    });

    test('dismiss calls toast.dismiss', () => {
        showToast.dismiss('toast-id');
        expect(toast.dismiss).toHaveBeenCalledWith('toast-id');
    });

    test('dismiss without id dismisses all toasts', () => {
        showToast.dismiss();
        expect(toast.dismiss).toHaveBeenCalledWith(undefined);
    });
});
