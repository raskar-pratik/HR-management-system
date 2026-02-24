import request from 'supertest';
import express from 'express';
import employeeRoutes from '../routes/employee.routes';
import { Employee, User, Department, Designation } from '../models';

// Mock Models
jest.mock('../models', () => ({
    Employee: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        count: jest.fn(),
    },
    User: {
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    },
    Department: { findByPk: jest.fn() },
    Designation: { findByPk: jest.fn() }
}));

// Mock Auth Middleware
jest.mock('../middleware/auth.middleware', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.user = {
            id: 'admin_123',
            role: 'company_admin',
            companyId: 'company_123'
        };
        next();
    },
    authorize: (...roles: string[]) => (req: any, res: any, next: any) => next(),
    tenantIsolation: (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/employees', employeeRoutes);

describe('Employee Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/v1/employees', () => {
        it('should return list of employees', async () => {
            const mockEmployees = [
                { id: '1', employeeCode: 'EMP001', user: { firstName: 'John', lastName: 'Doe' } }
            ];

            (Employee.findAll as jest.Mock).mockResolvedValue(mockEmployees);
            (Employee.count as jest.Mock).mockResolvedValue(1);

            const res = await request(app).get('/api/v1/employees');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.employees).toHaveLength(1);
        });
    });

    // Add Create, Update, Delete tests as needed...
});
