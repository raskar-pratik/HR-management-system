import apiClient, { withRetry, showSuccess } from '../utils/apiClient';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    company: {
        name: string;
        email: string;
    };
    admin: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
    };
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        accessToken: string;
        refreshToken: string;
    };
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'super_admin' | 'company_admin' | 'hr_manager' | 'manager' | 'employee';
    companyId: string;
    isActive: boolean;
}

export interface Employee {
    id: string;
    employeeCode: string;
    userId: string;
    departmentId: string;
    designationId: string;
    joinDate: string;
    employmentStatus: string;
    user: User;
    department?: { name: string };
    designation?: { name: string };
}

export interface Department {
    id: string;
    name: string;
    description: string;
    managerId: string;
    isActive: boolean;
}

export interface AttendanceRecord {
    id: string;
    date: string;
    clockIn: string;
    clockOut: string;
    workHours: number;
    status: string;
}

export interface LeaveRequest {
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: string;
}

export interface SalaryComponent {
    id: string;
    companyId: string;
    name: string;
    code: string;
    type: 'earning' | 'deduction';
    calculationType: 'fixed' | 'percentage';
    percentageOf?: string;
    isTaxable: boolean;
    isActive: boolean;
}

export interface SalaryStructureDetail {
    id: string;
    salaryStructureId: string;
    salaryComponentId: string;
    amount: number;
    component: SalaryComponent;
}

export interface SalaryStructure {
    id: string;
    companyId: string;
    employeeId: string;
    ctc: number;
    effectiveFrom: string;
    isActive: boolean;
    details: SalaryStructureDetail[];
}

export interface PayrollRun {
    id: string;
    companyId: string;
    month: number;
    year: number;
    status: 'draft' | 'processing' | 'completed' | 'paid';
    processedBy: string;
    processedAt: string;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    employeeCount: number;
}

export interface Payslip {
    id: string;
    companyId: string;
    employeeId: string;
    payrollRunId: string;
    month: number;
    year: number;
    workingDays: number;
    daysWorked: number;
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
    status: 'draft' | 'finalized' | 'paid';
    earningsBreakdown: Record<string, number>;
    deductionsBreakdown: Record<string, number>;
    employee?: {
        id: string;
        employeeCode: string;
        user: {
            name: string;
            email: string;
        };
    };
}

export interface AuditLog {
    id: string;
    entity: string;
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'OTHER';
    userId: string;
    user?: { firstName: string; lastName: string };
    details?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    createdAt: string;
}

class ApiService {
    // Auth endpoints
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/register', data);
        return response.data;
    }

    async getProfile(): Promise<{ success: boolean; data: User }> {
        const response = await apiClient.get<{ success: boolean; data: User }>('/auth/profile');
        return response.data;
    }

    async logout(): Promise<void> {
        await apiClient.post('/auth/logout');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth-storage');
    }

    // Employee endpoints
    async getEmployees(params?: { page?: number; limit?: number; search?: string }) {
        const response = await apiClient.get<{ success: boolean; data: { employees: Employee[]; pagination: { total: number } } }>(
            '/employees',
            { params }
        );
        return { success: response.data.success, data: { employees: response.data.data.employees, total: response.data.data.pagination?.total || 0 } };
    }

    async getEmployee(id: string) {
        const response = await apiClient.get<{ success: boolean; data: Employee }>(`/employees/${id}`);
        return response.data;
    }

    async createEmployee(data: Partial<Employee>) {
        const response = await apiClient.post<{ success: boolean; data: Employee }>('/employees', data);
        showSuccess('Employee created successfully!');
        return response.data;
    }

    async updateEmployee(id: string, data: Partial<Employee>) {
        const response = await apiClient.put<{ success: boolean; data: Employee }>(`/employees/${id}`, data);
        showSuccess('Employee updated successfully!');
        return response.data;
    }

    async deleteEmployee(id: string) {
        const response = await apiClient.delete(`/employees/${id}`);
        showSuccess('Employee deleted successfully!');
        return response.data;
    }

    async getEmployeeStats() {
        const response = await apiClient.get<{ success: boolean; data: Record<string, unknown> }>('/employees/stats');
        return response.data;
    }

    // Attendance endpoints
    async clockIn() {
        const response = await apiClient.post<{ success: boolean; data: AttendanceRecord }>('/attendance/clock-in');
        showSuccess('Clocked in successfully!');
        return response.data;
    }

    async clockOut() {
        const response = await apiClient.post<{ success: boolean; data: AttendanceRecord }>('/attendance/clock-out');
        showSuccess('Clocked out successfully!');
        return response.data;
    }

    async getTodayAttendance() {
        const response = await apiClient.get<{ success: boolean; data: AttendanceRecord | null }>('/attendance/today');
        return response.data;
    }

    async getAttendanceReport(params?: { startDate?: string; endDate?: string }) {
        // Use withRetry for reports as they might timeout
        return withRetry(async () => {
            const response = await apiClient.get<{ success: boolean; data: AttendanceRecord[] }>(
                '/attendance/report',
                { params }
            );
            return response.data;
        }, 2);
    }

    // Leave endpoints
    async applyLeave(data: Partial<LeaveRequest>) {
        const response = await apiClient.post<{ success: boolean; data: LeaveRequest }>('/leaves', data);
        showSuccess('Leave request submitted!');
        return response.data;
    }

    async getLeaves(params?: { status?: string }) {
        const response = await apiClient.get<{ success: boolean; data: { leaves: LeaveRequest[] } }>(
            '/leaves',
            { params }
        );
        return response.data;
    }

    async getLeaveBalance() {
        const response = await apiClient.get<{ success: boolean; data: Record<string, { used: number; total: number }> }>('/leaves/balance');
        return response.data;
    }

    async approveLeave(id: string, comments?: string) {
        const response = await apiClient.put(`/leaves/${id}/approve`, { comments });
        showSuccess('Leave approved!');
        return response.data;
    }

    async rejectLeave(id: string, comments?: string) {
        const response = await apiClient.put(`/leaves/${id}/reject`, { comments });
        showSuccess('Leave rejected!');
        return response.data;
    }

    // Department endpoints
    async getDepartments() {
        const response = await apiClient.get<{ success: boolean; data: Department[] }>('/departments');
        return response.data;
    }

    async createDepartment(data: Partial<Department>) {
        const response = await apiClient.post<{ success: boolean; data: Department }>('/departments', data);
        showSuccess('Department created!');
        return response.data;
    }

    // Company endpoints
    async getCompanyStats() {
        return withRetry(async () => {
            const response = await apiClient.get<{ success: boolean; data: { employees: number; departments: number; activeProjects?: number } }>('/company/stats');
            return response.data;
        }, 2);
    }

    // ==================== REPORTS ENDPOINTS ====================

    async getReportDashboard() {
        const response = await apiClient.get<{ success: boolean; data: Record<string, unknown> }>('/reports/dashboard');
        return response.data;
    }

    async getAdminAttendanceReport(params?: {
        startDate?: string;
        endDate?: string;
        month?: number;
        year?: number;
        departmentId?: string;
        format?: 'json' | 'csv';
    }) {
        if (params?.format === 'csv') {
            const response = await apiClient.get('/reports/attendance', {
                params,
                responseType: 'blob'
            });
            return response.data;
        }
        const response = await apiClient.get('/reports/attendance', { params });
        return response.data;
    }

    async getAuditLogs(params?: {
        page?: number;
        limit?: number;
        entity?: string;
        action?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const response = await apiClient.get<{ success: boolean; data: { logs: AuditLog[]; pagination: { total: number; totalPages: number } } }>('/audit', { params });
        return response.data;
    }

    async getLeaveSummaryReport(params?: {
        year?: number;
        departmentId?: string;
        format?: 'json' | 'csv';
    }) {
        if (params?.format === 'csv') {
            const response = await apiClient.get('/reports/leaves', {
                params,
                responseType: 'blob'
            });
            return response.data;
        }
        const response = await apiClient.get('/reports/leaves', { params });
        return response.data;
    }

    async getEmployeeDirectory(params?: {
        departmentId?: string;
        status?: string;
        format?: 'json' | 'csv';
    }) {
        if (params?.format === 'csv') {
            const response = await apiClient.get('/reports/employees', {
                params,
                responseType: 'blob'
            });
            return response.data;
        }
        const response = await apiClient.get('/reports/employees', { params });
        return response.data;
    }

    // ==================== EXPORT ENDPOINTS ====================

    async exportEmployees(params?: Record<string, string | number>) {
        const response = await apiClient.get('/export/employees', {
            params,
            responseType: 'blob'
        });
        this.downloadCSV(response.data, 'employees.xlsx');
    }

    async exportAttendance(params?: Record<string, string | number>) {
        const response = await apiClient.get('/export/attendance', {
            params,
            responseType: 'blob'
        });
        this.downloadCSV(response.data, 'attendance_report.pdf');
    }

    async exportLeaves(params?: Record<string, string | number>) {
        const response = await apiClient.get('/export/leaves', {
            params,
            responseType: 'blob'
        });
        this.downloadCSV(response.data, 'leaves.xlsx');
    }

    // ==================== PAYROLL ENDPOINTS ====================

    async getSalaryComponents() {
        const response = await apiClient.get<{ success: boolean; data: SalaryComponent[] }>('/payroll/salary-components');
        return response.data;
    }

    async createSalaryComponent(data: Partial<SalaryComponent>) {
        const response = await apiClient.post<{ success: boolean; data: SalaryComponent }>('/payroll/salary-components', data);
        showSuccess('Salary component created!');
        return response.data;
    }

    async getSalaryStructure(employeeId: string) {
        const response = await apiClient.get<{ success: boolean; data: SalaryStructure }>(`/payroll/salary-structures/${employeeId}`);
        return response.data;
    }

    async createSalaryStructure(data: Partial<SalaryStructure>) {
        const response = await apiClient.post<{ success: boolean; data: SalaryStructure }>('/payroll/salary-structures', data);
        showSuccess('Salary structure created!');
        return response.data;
    }

    async processPayroll(data: { month: number; year: number }) {
        const response = await apiClient.post<{ success: boolean; message: string }>('/payroll/process', data);
        showSuccess(response.data.message);
        return response.data;
    }

    async getPayrollRuns() {
        const response = await apiClient.get<{ success: boolean; data: PayrollRun[] }>('/payroll/runs');
        return response.data;
    }

    async getPayslips(params?: { payrollRunId?: string }) {
        const response = await apiClient.get<{ success: boolean; data: Payslip[] }>('/payroll/payslips', { params });
        return response.data;
    }

    // ==================== IMPORT ENDPOINTS ====================

    async previewImport(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<{
            success: boolean;
            data: { rows: unknown[]; totalRows: number; validRows: number; invalidRows: number }
        }>('/import/preview', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    async processImport(rows: unknown[]) {
        const response = await apiClient.post<{ success: boolean; message: string; data: unknown }>('/import/process', { rows });
        return response.data;
    }

    // Helper to download CSV/Excel/PDF
    downloadCSV(data: Blob, filename: string) {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    // ==================== UPLOAD ENDPOINTS ====================

    async uploadFile(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post<{ success: boolean; data: { url: string; fileId: string } }>('/uploads', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    }
}

export const api = new ApiService();
export default api;

// Re-export utilities
export { showSuccess, showError, withRetry } from '../utils/apiClient';
