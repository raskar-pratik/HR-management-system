import { useState, useEffect, useCallback } from 'react';
import {
    Settings, Building2, User, Calendar, Palmtree,
    Save, Loader2, Plus, Trash2, X, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';

type SettingsTab = 'company' | 'user' | 'leaveTypes' | 'holidays';

// ==================== SCHEMAS ====================

const companySchema = z.object({
    name: z.string().min(2, 'Company name is required'),
    email: z.string().email('Valid email required'),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(6, 'Minimum 6 characters'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

const profileSchema = z.object({
    firstName: z.string().min(1, 'First name required'),
    lastName: z.string().min(1, 'Last name required'),
    email: z.string().email('Valid email required'),
    phone: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

// ==================== MAIN COMPONENT ====================

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('company');

    const tabs = [
        { id: 'company' as const, label: 'Company Profile', icon: Building2 },
        { id: 'user' as const, label: 'User Settings', icon: User },
        { id: 'leaveTypes' as const, label: 'Leave Types', icon: Calendar },
        { id: 'holidays' as const, label: 'Holidays', icon: Palmtree },
    ];

    return (
        <div className="settings-page">
            {/* Header */}
            <div className="page-header">
                <h1><Settings size={28} /> Settings</h1>
                <p>Manage your company and account settings</p>
            </div>

            {/* Tab Navigation */}
            <div className="settings-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="settings-content">
                {activeTab === 'company' && <CompanyProfileTab />}
                {activeTab === 'user' && <UserSettingsTab />}
                {activeTab === 'leaveTypes' && <LeaveTypesTab />}
                {activeTab === 'holidays' && <HolidaysTab />}
            </div>
        </div>
    );
}

// ==================== COMPANY PROFILE TAB ====================

function CompanyProfileTab() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty }
    } = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
    });

    const loadCompanyData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Mock data - replace with actual API call
            const mockData: CompanyFormData = {
                name: 'Acme Corporation',
                email: 'contact@acme.com',
                phone: '+1 234 567 890',
                address: '123 Business St',
                city: 'San Francisco',
                country: 'USA',
                website: 'https://acme.com',
            };
            setCompanyData(mockData);
            reset(mockData);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load company data');
        } finally {
            setIsLoading(false);
        }
    }, [reset]);

    useEffect(() => {
        loadCompanyData();
    }, [loadCompanyData]);

    const onSubmit = async (data: CompanyFormData) => {
        setIsSaving(true);
        try {
            // TODO: Implement API call to save company data
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
            toast.success('Company profile updated!');
            setCompanyData(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="loading-state"><Loader2 className="spinning" size={32} /> Loading...</div>;
    }

    return (
        <div className="settings-section">
            <div className="section-header">
                <h2>Company Profile</h2>
                <p>Update your company information</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="settings-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label>Company Name *</label>
                        <input {...register('name')} placeholder="Enter company name" />
                        {errors.name && <span className="error">{errors.name.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input {...register('email')} type="email" placeholder="company@example.com" />
                        {errors.email && <span className="error">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                        <label>Phone</label>
                        <input {...register('phone')} placeholder="+1 234 567 890" />
                    </div>

                    <div className="form-group">
                        <label>Website</label>
                        <input {...register('website')} placeholder="https://yourcompany.com" />
                        {errors.website && <span className="error">{errors.website.message}</span>}
                    </div>

                    <div className="form-group full-width">
                        <label>Address</label>
                        <input {...register('address')} placeholder="Street address" />
                    </div>

                    <div className="form-group">
                        <label>City</label>
                        <input {...register('city')} placeholder="City" />
                    </div>

                    <div className="form-group">
                        <label>Country</label>
                        <input {...register('country')} placeholder="Country" />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => reset(companyData || undefined)}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={!isDirty || isSaving}>
                        {isSaving ? <><Loader2 className="spinning" size={18} /> Saving...</> : <><Save size={18} /> Save Changes</>}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ==================== USER SETTINGS TAB ====================

function UserSettingsTab() {
    const user = useAuthStore(state => state.user);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phone: '',
        }
    });

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    const onSaveProfile = async (data: ProfileFormData) => {
        setIsSavingProfile(true);
        try {
            console.log('Update profile:', data);
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Profile updated!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const onChangePassword = async (data: PasswordFormData) => {
        setIsSavingPassword(true);
        try {
            console.log('Change password:', data);
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Password changed successfully!');
            passwordForm.reset();
        } catch (error) {
            console.error(error);
            toast.error('Failed to change password');
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="settings-section">
            {/* Profile Section */}
            <div className="section-header">
                <h2>Profile Information</h2>
                <p>Update your personal information</p>
            </div>

            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="settings-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label>First Name *</label>
                        <input {...profileForm.register('firstName')} />
                        {profileForm.formState.errors.firstName && (
                            <span className="error">{profileForm.formState.errors.firstName.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Last Name *</label>
                        <input {...profileForm.register('lastName')} />
                        {profileForm.formState.errors.lastName && (
                            <span className="error">{profileForm.formState.errors.lastName.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input {...profileForm.register('email')} type="email" />
                        {profileForm.formState.errors.email && (
                            <span className="error">{profileForm.formState.errors.email.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Phone</label>
                        <input {...profileForm.register('phone')} />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={isSavingProfile}>
                        {isSavingProfile ? <><Loader2 className="spinning" size={18} /> Saving...</> : <><Save size={18} /> Save Profile</>}
                    </button>
                </div>
            </form>

            {/* Password Section */}
            <div className="section-divider" />

            <div className="section-header">
                <h2>Change Password</h2>
                <p>Update your account password</p>
            </div>

            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="settings-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label>Current Password *</label>
                        <input {...passwordForm.register('currentPassword')} type="password" />
                        {passwordForm.formState.errors.currentPassword && (
                            <span className="error">{passwordForm.formState.errors.currentPassword.message}</span>
                        )}
                    </div>

                    <div className="form-group" />

                    <div className="form-group">
                        <label>New Password *</label>
                        <input {...passwordForm.register('newPassword')} type="password" />
                        {passwordForm.formState.errors.newPassword && (
                            <span className="error">{passwordForm.formState.errors.newPassword.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Confirm Password *</label>
                        <input {...passwordForm.register('confirmPassword')} type="password" />
                        {passwordForm.formState.errors.confirmPassword && (
                            <span className="error">{passwordForm.formState.errors.confirmPassword.message}</span>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={isSavingPassword}>
                        {isSavingPassword ? <><Loader2 className="spinning" size={18} /> Changing...</> : 'Change Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ==================== LEAVE TYPES TAB ====================

interface LeaveType {
    id: string;
    name: string;
    code: string;
    daysAllowed: number;
    carryForward: boolean;
    isActive: boolean;
}

function LeaveTypesTab() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([
        { id: '1', name: 'Annual Leave', code: 'AL', daysAllowed: 21, carryForward: true, isActive: true },
        { id: '2', name: 'Sick Leave', code: 'SL', daysAllowed: 12, carryForward: false, isActive: true },
        { id: '3', name: 'Casual Leave', code: 'CL', daysAllowed: 6, carryForward: false, isActive: true },
        { id: '4', name: 'Maternity Leave', code: 'ML', daysAllowed: 90, carryForward: false, isActive: true },
    ]);
    const [isAdding, setIsAdding] = useState(false);
    const [newLeaveType, setNewLeaveType] = useState({ name: '', code: '', daysAllowed: 0, carryForward: false });

    const handleAdd = () => {
        if (!newLeaveType.name || !newLeaveType.code) {
            toast.error('Name and code are required');
            return;
        }
        const newType: LeaveType = {
            id: Date.now().toString(),
            ...newLeaveType,
            isActive: true
        };
        setLeaveTypes([...leaveTypes, newType]);
        setNewLeaveType({ name: '', code: '', daysAllowed: 0, carryForward: false });
        setIsAdding(false);
        toast.success('Leave type added!');
    };

    const handleDelete = (id: string) => {
        setLeaveTypes(leaveTypes.filter(lt => lt.id !== id));
        toast.success('Leave type deleted!');
    };

    const toggleActive = (id: string) => {
        setLeaveTypes(leaveTypes.map(lt =>
            lt.id === id ? { ...lt, isActive: !lt.isActive } : lt
        ));
    };

    return (
        <div className="settings-section">
            <div className="section-header">
                <div>
                    <h2>Leave Types</h2>
                    <p>Configure leave types available for employees</p>
                </div>
                <button className="btn-primary" onClick={() => setIsAdding(true)}>
                    <Plus size={18} /> Add Leave Type
                </button>
            </div>

            <div className="settings-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Days Allowed</th>
                            <th>Carry Forward</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isAdding && (
                            <tr className="editing-row">
                                <td>
                                    <input
                                        value={newLeaveType.name}
                                        onChange={e => setNewLeaveType({ ...newLeaveType, name: e.target.value })}
                                        placeholder="Leave name"
                                    />
                                </td>
                                <td>
                                    <input
                                        value={newLeaveType.code}
                                        onChange={e => setNewLeaveType({ ...newLeaveType, code: e.target.value.toUpperCase() })}
                                        placeholder="CODE"
                                        maxLength={5}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={newLeaveType.daysAllowed}
                                        onChange={e => setNewLeaveType({ ...newLeaveType, daysAllowed: parseInt(e.target.value) || 0 })}
                                        min={0}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={newLeaveType.carryForward}
                                        onChange={e => setNewLeaveType({ ...newLeaveType, carryForward: e.target.checked })}
                                    />
                                </td>
                                <td>-</td>
                                <td className="actions">
                                    <button className="btn-icon success" onClick={handleAdd}><Check size={16} /></button>
                                    <button className="btn-icon danger" onClick={() => setIsAdding(false)}><X size={16} /></button>
                                </td>
                            </tr>
                        )}
                        {leaveTypes.map(lt => (
                            <tr key={lt.id} className={!lt.isActive ? 'inactive' : ''}>
                                <td><strong>{lt.name}</strong></td>
                                <td><span className="code-badge">{lt.code}</span></td>
                                <td>{lt.daysAllowed} days</td>
                                <td>{lt.carryForward ? '✓ Yes' : '✗ No'}</td>
                                <td>
                                    <span className={`status-badge ${lt.isActive ? 'active' : 'inactive'}`}>
                                        {lt.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="actions">
                                    <button className="btn-icon" onClick={() => toggleActive(lt.id)}>
                                        {lt.isActive ? <X size={16} /> : <Check size={16} />}
                                    </button>
                                    <button className="btn-icon danger" onClick={() => handleDelete(lt.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ==================== HOLIDAYS TAB ====================

interface Holiday {
    id: string;
    name: string;
    date: string;
    type: 'national' | 'optional' | 'company';
}

function HolidaysTab() {
    const [holidays, setHolidays] = useState<Holiday[]>([
        { id: '1', name: 'New Year\'s Day', date: '2026-01-01', type: 'national' },
        { id: '2', name: 'Republic Day', date: '2026-01-26', type: 'national' },
        { id: '3', name: 'Good Friday', date: '2026-04-03', type: 'optional' },
        { id: '4', name: 'Independence Day', date: '2026-08-15', type: 'national' },
        { id: '5', name: 'Company Foundation Day', date: '2026-03-15', type: 'company' },
    ]);
    const [isAdding, setIsAdding] = useState(false);
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'company' as Holiday['type'] });

    const handleAdd = () => {
        if (!newHoliday.name || !newHoliday.date) {
            toast.error('Name and date are required');
            return;
        }
        const holiday: Holiday = {
            id: Date.now().toString(),
            ...newHoliday
        };
        setHolidays([...holidays, holiday].sort((a, b) => a.date.localeCompare(b.date)));
        setNewHoliday({ name: '', date: '', type: 'company' });
        setIsAdding(false);
        toast.success('Holiday added!');
    };

    const handleDelete = (id: string) => {
        setHolidays(holidays.filter(h => h.id !== id));
        toast.success('Holiday deleted!');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getTypeColor = (type: Holiday['type']) => {
        switch (type) {
            case 'national': return 'national';
            case 'optional': return 'optional';
            case 'company': return 'company';
        }
    };

    return (
        <div className="settings-section">
            <div className="section-header">
                <div>
                    <h2>Company Holidays</h2>
                    <p>Manage holidays for your company calendar</p>
                </div>
                <button className="btn-primary" onClick={() => setIsAdding(true)}>
                    <Plus size={18} /> Add Holiday
                </button>
            </div>

            {isAdding && (
                <div className="add-holiday-form">
                    <div className="form-row">
                        <input
                            placeholder="Holiday name"
                            value={newHoliday.name}
                            onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                        />
                        <input
                            type="date"
                            value={newHoliday.date}
                            onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                        />
                        <select
                            value={newHoliday.type}
                            onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value as Holiday['type'] })}
                        >
                            <option value="national">National</option>
                            <option value="optional">Optional</option>
                            <option value="company">Company</option>
                        </select>
                        <button className="btn-success" onClick={handleAdd}><Check size={18} /> Add</button>
                        <button className="btn-secondary" onClick={() => setIsAdding(false)}><X size={18} /></button>
                    </div>
                </div>
            )}

            <div className="holidays-grid">
                {holidays.map(holiday => (
                    <div key={holiday.id} className="holiday-card">
                        <div className="holiday-date">
                            <span className="day">{new Date(holiday.date).getDate()}</span>
                            <span className="month">{new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                        </div>
                        <div className="holiday-info">
                            <h4>{holiday.name}</h4>
                            <p>{formatDate(holiday.date)}</p>
                            <span className={`type-badge ${getTypeColor(holiday.type)}`}>{holiday.type}</span>
                        </div>
                        <button className="btn-icon danger" onClick={() => handleDelete(holiday.id)}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
