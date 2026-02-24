// User interface for request object
export interface AuthUser {
    id: string;
    companyId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'super_admin' | 'company_admin' | 'hr_manager' | 'manager' | 'employee';
    isActive: boolean;
}

// Extend Express Request to include user and companyId
declare global {
    namespace Express {
        interface Request {
            user: AuthUser;
            companyId: string;
        }
    }
}

// JWT Payload interface
export interface JwtPayload {
    userId: string;
    companyId: string;
    role: string;
    email: string;
    iat?: number;
    exp?: number;
}

// API Response interfaces
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// Query parameters
export interface PaginationQuery {
    page?: string | number;
    limit?: string | number;
}

export interface DateRangeQuery {
    startDate?: string;
    endDate?: string;
}

// Leave status type
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// Attendance status type  
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';

// Employee status type
export type EmployeeStatus = 'active' | 'inactive' | 'terminated' | 'on_leave';
