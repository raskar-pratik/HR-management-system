import axios, {
    AxiosError,
    type AxiosInstance,
    type InternalAxiosRequestConfig,
    type AxiosResponse
} from 'axios';
import { showToast } from '../utils/toast';

// Error response interface
interface ApiErrorResponse {
    success: false;
    message: string;
    error?: string;
    errors?: Array<{ field: string; message: string }>;
}

// User-friendly error messages mapping
const ERROR_MESSAGES: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Session expired. Please login again.',
    403: 'You don\'t have permission to perform this action.',
    404: 'The requested resource was not found.',
    408: 'Request timeout. Please try again.',
    409: 'This action conflicts with existing data.',
    422: 'Invalid data. Please check the form fields.',
    429: 'Too many requests. Please wait a moment.',
    500: 'Server error. Our team has been notified.',
    502: 'Server is temporarily unavailable.',
    503: 'Service unavailable. Please try again later.',
    504: 'Server timeout. Please try again.',
};

// Network error messages
const NETWORK_ERRORS: Record<string, string> = {
    ERR_NETWORK: 'Network error. Please check your internet connection.',
    ERR_CANCELED: 'Request was cancelled.',
    ECONNABORTED: 'Connection timed out. Please try again.',
    ERR_BAD_REQUEST: 'Invalid request. Please try again.',
};

// Create axios instance with defaults
const apiClient: AxiosInstance = axios.create({
    baseURL: 'https://backend-production-d8f7.up.railway.app/api/v1',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle network errors
        if (!error.response) {
            const networkErrorCode = error.code || 'ERR_NETWORK';
            const message = NETWORK_ERRORS[networkErrorCode] || 'Network error. Please try again.';
            showToast.error(message);
            return Promise.reject(new Error(message));
        }

        const status = error.response.status;
        const data = error.response.data;

        // Handle 401 - Token expired, try refresh
        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(
                        `https://backend-production-d8f7.up.railway.app/api/v1/auth/refresh`,
                        { refreshToken }
                    );

                    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    // Retry original request with new token
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    }
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // Refresh failed - logout user
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('auth-storage');

                    showToast.error('Session expired. Please login again.');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token - redirect to login
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }

        // Get user-friendly message
        let message = data?.message || ERROR_MESSAGES[status] || 'An unexpected error occurred.';

        // Handle validation errors
        if (data?.errors && Array.isArray(data.errors)) {
            message = data.errors.map(e => e.message).join(', ');
        }

        // Show toast for specific error types
        if (status !== 401) { // Don't toast 401 twice

            if (status >= 500) {
                showToast.error(message);
            } else if (status === 403) {
                showToast.error(message);
            } else if (status === 404) {
                showToast.error(message);
            } else if (status === 429) {
                showToast.warning(message);
            } else {
                showToast.error(message);
            }
        }

        // Create enriched error object
        const enrichedError = new Error(message) as Error & {
            status: number;
            originalError: AxiosError;
        };
        enrichedError.status = status;
        enrichedError.originalError = error;

        return Promise.reject(enrichedError);
    }
);

// Retry logic utility
export const withRetry = async <T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Don't retry on client errors (4xx)
            if (error instanceof Error && 'status' in error) {
                const status = (error as Error & { status: number }).status;
                if (status >= 400 && status < 500) {
                    throw error;
                }
            }

            // Wait before retry with exponential backoff
            if (attempt < retries - 1) {
                const backoff = delay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, backoff));
                showToast.info(`Retrying... (${attempt + 2}/${retries})`);
            }
        }
    }

    showToast.dismiss();
    throw lastError;
};

// Re-export from centralized toast utility
export { showToast } from '../utils/toast';
export const showSuccess = (msg: string) => showToast.success(msg);
export const showError = (msg: string) => showToast.error(msg);

export default apiClient;
