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
    ChevronLeft, ChevronRight, Eye, User, Mail, Calendar
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

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
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

    const handleDeleteClick = (id: string) => {
        setDeleteModal({ show: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        setIsLoading(true); // Re-use main loading or add specific state? specific is better but for now re-use is ok or just modal loading
        // Actually, Modal has its own isLoading prop
        try {
            await api.deleteEmployee(deleteModal.id);
            toast.success('Employee deactivated');
            setDeleteModal({ show: false, id: null });
            loadEmployees();
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to delete';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="employees-page">
            <div className="page-header">
                <div className="header-left">
                    <Users size={32} className="page-icon" />
                    <div>
                        <h1>Employees</h1>
                        <p>{total} total employees</p>
                    </div>
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={20} />
                    Add Employee
                </button>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search employees..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Employees Table */}
            <div className="table-container">
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
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Employee Code</th>
                                <th>Department</th>
                                <th>Designation</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.id}>
                                    <td>
                                        <div className="employee-info">
                                            <div className="avatar">
                                                {emp.user?.firstName?.[0]}{emp.user?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <strong>{emp.user?.firstName} {emp.user?.lastName}</strong>
                                                <span>{emp.user?.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{emp.employeeCode}</td>
                                    <td>{emp.department?.name || '-'}</td>
                                    <td>{emp.designation?.name || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${emp.employmentStatus}`}>
                                            {emp.employmentStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon" title="View">
                                                <Eye size={18} />
                                            </button>
                                            <button className="btn-icon" title="Edit">
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                className="btn-icon danger"
                                                title="Delete"
                                                onClick={() => handleDeleteClick(emp.id)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="btn-page"
                        onClick={() => setPage(p => p - 1)}
                        disabled={page === 1}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                        className="btn-page"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page === totalPages}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

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
                isLoading={isLoading && !!deleteModal.id}
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
            // Adapt the data structure to match what the API expects
            // The API likely expects the same structure as before, or we might need to adjust
            // Based on previous code: api.createEmployee(formData) where formData was flat
            // Casting to any because api.createEmployee expects Partial<Employee> which doesn't have flat fields
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await api.createEmployee({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                joinDate: data.joinDate,
            } as any);
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
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Employee</h2>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-row">
                            <FormInput
                                label="First Name"
                                name="firstName"
                                placeholder="John"
                                icon={<User size={16} />}
                            />
                            <FormInput
                                label="Last Name"
                                name="lastName"
                                placeholder="Doe"
                                icon={<User size={16} />}
                            />
                        </div>

                        <FormInput
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="john.doe@company.com"
                            icon={<Mail size={16} />}
                        />

                        <FormInput
                            label="Join Date"
                            name="joinDate"
                            type="date"
                            icon={<Calendar size={16} />}
                        />

                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <div className="spinner-small mr-2"></div>
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} className="mr-2" />
                                        Add Employee
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </FormProvider>
            </div>
        </div>
    );
}
