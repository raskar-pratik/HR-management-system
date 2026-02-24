// Export all models and set up associations
import Company from './Company';
import User from './User';
import Department from './Department';
import Designation from './Designation';
import Employee from './Employee';
import Attendance from './Attendance';
import Leave from './Leave';
import AuditLog from './AuditLog';
import SalaryComponent from './SalaryComponent';
import SalaryStructure from './SalaryStructure';
import SalaryStructureDetail from './SalaryStructureDetail';
import PayrollRun from './PayrollRun';
import Payslip from './Payslip';

// ==================== ASSOCIATIONS ====================

// Company has many Users
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Company has many Departments
Company.hasMany(Department, { foreignKey: 'companyId', as: 'departments' });
Department.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Company has many Designations
Company.hasMany(Designation, { foreignKey: 'companyId', as: 'designations' });
Designation.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Company has many Employees
Company.hasMany(Employee, { foreignKey: 'companyId', as: 'employees' });
Employee.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// User has one Employee profile
User.hasOne(Employee, { foreignKey: 'userId', as: 'employee' });
Employee.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Employee belongs to Department
Department.hasMany(Employee, { foreignKey: 'departmentId', as: 'employees' });
Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// Employee belongs to Designation
Designation.hasMany(Employee, { foreignKey: 'designationId', as: 'employees' });
Employee.belongsTo(Designation, { foreignKey: 'designationId', as: 'designation' });

// Employee has Manager (self-reference)
Employee.belongsTo(Employee, { foreignKey: 'managerId', as: 'manager' });
Employee.hasMany(Employee, { foreignKey: 'managerId', as: 'subordinates' });

// Department has Manager
Employee.hasMany(Department, { foreignKey: 'managerId', as: 'managedDepartments' });
Department.belongsTo(Employee, { foreignKey: 'managerId', as: 'manager' });

// Department parent-child relationship
Department.belongsTo(Department, { foreignKey: 'parentId', as: 'parent' });
Department.hasMany(Department, { foreignKey: 'parentId', as: 'children' });

// Employee has many Attendance records
Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Company has many Attendance records
Company.hasMany(Attendance, { foreignKey: 'companyId', as: 'attendances' });
Attendance.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Employee has many Leave records
Employee.hasMany(Leave, { foreignKey: 'employeeId', as: 'leaves' });
Leave.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Company has many Leave records
Company.hasMany(Leave, { foreignKey: 'companyId', as: 'leaves' });
Leave.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Leave has Approver (Employee)
Employee.hasMany(Leave, { foreignKey: 'approverId', as: 'approvedLeaves' });
Leave.belongsTo(Employee, { foreignKey: 'approverId', as: 'approver' });

// AuditLog Associations
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Company.hasMany(AuditLog, { foreignKey: 'companyId', as: 'auditLogs' });
AuditLog.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Payroll Associations
Company.hasMany(SalaryComponent, { foreignKey: 'companyId', as: 'salaryComponents' });
SalaryComponent.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(SalaryStructure, { foreignKey: 'companyId', as: 'salaryStructures' });
SalaryStructure.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Employee.hasOne(SalaryStructure, { foreignKey: 'employeeId', as: 'salaryStructure' });
SalaryStructure.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

SalaryStructure.hasMany(SalaryStructureDetail, { foreignKey: 'salaryStructureId', as: 'details' });
SalaryStructureDetail.belongsTo(SalaryStructure, { foreignKey: 'salaryStructureId', as: 'structure' });

SalaryComponent.hasMany(SalaryStructureDetail, { foreignKey: 'salaryComponentId', as: 'structureDetails' });
SalaryStructureDetail.belongsTo(SalaryComponent, { foreignKey: 'salaryComponentId', as: 'component' });

Company.hasMany(PayrollRun, { foreignKey: 'companyId', as: 'payrollRuns' });
PayrollRun.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

PayrollRun.hasMany(Payslip, { foreignKey: 'payrollRunId', as: 'payslips' });
Payslip.belongsTo(PayrollRun, { foreignKey: 'payrollRunId', as: 'payrollRun' });

Employee.hasMany(Payslip, { foreignKey: 'employeeId', as: 'payslips' });
Payslip.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Company.hasMany(Payslip, { foreignKey: 'companyId', as: 'payslips' });
Payslip.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// ==================== EXPORT ====================

export {
    Company,
    User,
    Department,
    Designation,
    Employee,
    Attendance,
    Leave,
    AuditLog,
    SalaryComponent,
    SalaryStructure,
    SalaryStructureDetail,
    PayrollRun,
    Payslip
};

export default {
    Company,
    User,
    Department,
    Designation,
    Employee,
    Attendance,
    Leave,
    AuditLog,
    SalaryComponent,
    SalaryStructure,
    SalaryStructureDetail,
    PayrollRun,
    Payslip
};
