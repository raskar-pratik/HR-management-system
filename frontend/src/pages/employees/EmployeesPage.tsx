import { useEffect, useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EmployeeListSkeleton } from '../../components/Skeleton';
import { FormInput } from '../../components/FormInput';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import {
    Users, Plus, Search, Edit, Trash2,
    ChevronLeft, ChevronRight, Eye, User, Mail, Calendar, Download, MoreHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { Employee } from '../../services/api';

const employeeSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    joinDate: z.string().min(1, 'Join date is required'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

const DEPT_COLORS: Record<string, string> = {
    Engineering: 'badge-blue',
    Marketing: 'badge-purple',
    HR: 'badge-green',
    Finance: 'badge-amber',
    Sales: 'badge-teal',
    Operations: 'badge-gray',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'badge-green',
    inactive: 'badge-gray',
    probation: 'badge-amber',
    resigned: 'badge-red',
};

function getAvatarBg(name: string) {
    const colors = ['#0d968b', '#7c3aed', '#3b82f6', '#10b981', '#f59e0b'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
    const initials = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    return (
        <div className={`avatar avatar-${size}`} style={{ background: getAvatarBg(name) }}>
            {initials}
        </div>
    );
}

const DEPT_FILTERS = ['All', 'Engineering', 'Marketing', 'HR', 'Finance', 'Sales', 'Operations'];

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
    const limit = 10;

    const loadEmployees = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.getEmployees({ page, limit, search });
            setEmployees(response.data.employees || []);
            setTotal(response.data.total || 0);
        } catch (error) {
            toast.error('Failed to load employees');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search]);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    const handleDeleteClick = (id: string) => setDeleteModal({ show: true, id });

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            await api.deleteEmployee(deleteModal.id);
            toast.success('Employee deactivated');
            setDeleteModal({ show: false, id: null });
            loadEmployees();
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to delete';
            toast.error(errorMsg);
        }
    };

    const totalPages = Math.ceil(total / limit);
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    const handleExportCSV = async () => {
        try {
            await api.exportEmployees();
        } catch {
            toast.error('Export failed');
        }
    };

    return (
        <div className="page-wrapper">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Employees</h1>
                    <p className="page-subtitle">{total} team members across all departments</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={handleExportCSV}>
                        <Download size={15} />
                        Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={15} />
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="search-filter-bar">
                <div className="search-input-wrapper">
                    <span className="search-input-icon"><Search size={15} /></span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, email, role..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="filter-chips">
                    {DEPT_FILTERS.map(dept => (
                        <button
                            key={dept}
                            className={`filter-chip${deptFilter === dept ? ' active' : ''}`}
                            onClick={() => setDeptFilter(dept)}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                {isLoading ? (
                    <EmployeeListSkeleton />
                ) : employees.length === 0 ? (
                    <EmptyState
                        title="No employees found"
                        description="Get started by adding your first employee to the system."
                        icon={Users}
                        actionLabel="Add Employee"
                        onAction={() => setShowAddModal(true)}
                    />
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Join Date</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => {
                                    const fullName = `${emp.user?.firstName ?? ''} ${emp.user?.lastName ?? ''}`.trim();
                                    const dept = emp.department?.name ?? '';
                                    const status = emp.employmentStatus ?? 'active';
                                    const deptClass = DEPT_COLORS[dept] ?? 'badge-gray';
                                    const statusClass = STATUS_COLORS[status] ?? 'badge-gray';

                                    return (
                                        <tr key={emp.id}>
                                            <td>
                                                <div className="employee-cell">
                                                    <Avatar name={fullName || 'U U'} size="md" />
                                                    <div className="employee-cell-info">
                                                        <span className="employee-cell-name">{fullName}</span>
                                                        <span className="employee-cell-email">{emp.user?.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {dept ? (
                                                    <span className={`badge ${deptClass}`}>{dept}</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-light)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                {emp.designation?.name ?? '—'}
                                            </td>
                                            <td>
                                                <span className={`badge ${statusClass}`}>
                                                    <span className="badge-dot" />
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                                {emp.joinDate
                                                    ? new Date(emp.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                    : '—'
                                                }
                                            </td>
                                            <td>
                                                <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost btn-sm btn-icon-only" title="View">
                                                        <Eye size={15} />
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm btn-icon-only" title="Edit">
                                                        <Edit size={15} />
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm btn-icon-only"
                                                        title="Deactivate"
                                                        onClick={() => handleDeleteClick(emp.id)}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="pagination">
                            <span className="pagination-info">
                                Showing {startItem}–{endItem} of {total} employees
                            </span>
                            <div className="pagination-controls">
                                <button
                                    className="page-btn"
                                    onClick={() => setPage(p => p - 1)}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    const p = i + 1;
                                    return (
                                        <button
                                            key={p}
                                            className={`page-btn${page === p ? ' active' : ''}`}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                                {totalPages > 5 && <span style={{ padding: '0 4px', color: 'var(--text-light)' }}>...</span>}
                                <button
                                    className="page-btn"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page === totalPages || totalPages === 0}
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Add Employee Modal */}
            {showAddModal && (
                <AddEmployeeModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        loadEmployees();
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null })}
                onConfirm={confirmDelete}
                title="Deactivate Employee"
                message="Are you sure you want to deactivate this employee? They will no longer be able to log in."
                confirmLabel="Deactivate"
                variant="danger"
                isLoading={false}
            />
        </div>
    );
}

function AddEmployeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [isLoading, setIsLoading] = useState(false);

    const methods = useForm<EmployeeFormData>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            joinDate: new Date().toISOString().split('T')[0],
        },
    });

    const { handleSubmit } = methods;

    const onSubmit = async (data: EmployeeFormData) => {
        setIsLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await api.createEmployee({ ...data } as any);
            toast.success('Employee added successfully!');
            onSuccess();
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to add employee';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">Add New Employee</span>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="modal-body">
                            <div className="form-row">
                                <FormInput
                                    label="First Name"
                                    name="firstName"
                                    placeholder="Jane"
                                    icon={<User size={14} />}
                                />
                                <FormInput
                                    label="Last Name"
                                    name="lastName"
                                    placeholder="Doe"
                                    icon={<User size={14} />}
                                />
                            </div>
                            <FormInput
                                label="Email Address"
                                name="email"
                                type="email"
                                placeholder="jane.doe@company.com"
                                icon={<Mail size={14} />}
                            />
                            <FormInput
                                label="Join Date"
                                name="joinDate"
                                type="date"
                                icon={<Calendar size={14} />}
                            />
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? (
                                    <><span className="spinner" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }} /> Adding...</>
                                ) : (
                                    <><Plus size={14} /> Add Employee</>
                                )}
                            </button>
                        </div>
                    </form>
                </FormProvider>
            </div>
        </div>
    );
}
