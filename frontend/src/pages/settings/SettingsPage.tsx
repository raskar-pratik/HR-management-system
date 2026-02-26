import { useState, useEffect, useCallback } from 'react';
import {
    Settings, Building2, User, Calendar, Palmtree,
    Save, Loader2, Plus, Trash2, X, Check, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';

type SettingsTab = 'company' | 'user' | 'leaveTypes' | 'holidays';

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
}).refine(d => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match", path: ['confirmPassword'],
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

const TABS: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'user', label: 'User Settings', icon: User },
    { id: 'leaveTypes', label: 'Leave Types', icon: Calendar },
    { id: 'holidays', label: 'Holidays', icon: Palmtree },
];

/* ─── Section wrapper ──────────────────────────────────────────── */
function Section({ title, subtitle, action, children }: {
    title: string; subtitle?: string;
    action?: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{title}</h2>
                    {subtitle && <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

/* ─── Form field ───────────────────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{label}</label>
            {children}
            {error && <span className="form-error">{error}</span>}
        </div>
    );
}

/* ─── Divider ──────────────────────────────────────────────────── */
function Divider() {
    return <div style={{ height: 1, background: 'var(--border-light)', margin: '28px 0' }} />;
}

/* ═══════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('company');

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage your company and account preferences</p>
                </div>
            </div>

            {/* Tab nav */}
            <div className="filter-chips" style={{ marginBottom: 28 }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`filter-chip${activeTab === tab.id ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="card card-padded">
                {activeTab === 'company' && <CompanyProfileTab />}
                {activeTab === 'user' && <UserSettingsTab />}
                {activeTab === 'leaveTypes' && <LeaveTypesTab />}
                {activeTab === 'holidays' && <HolidaysTab />}
            </div>
        </div>
    );
}

/* ─── Company Profile ──────────────────────────────────────────── */
function CompanyProfileTab() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);

    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const mock: CompanyFormData = {
                name: 'Acme Corporation', email: 'contact@acme.com',
                phone: '+1 234 567 890', address: '123 Business St',
                city: 'San Francisco', country: 'USA', website: 'https://acme.com',
            };
            setCompanyData(mock);
            reset(mock);
        } catch {
            toast.error('Failed to load company data');
        } finally {
            setIsLoading(false);
        }
    }, [reset]);

    useEffect(() => { loadData(); }, [loadData]);

    const onSubmit = async (data: CompanyFormData) => {
        setIsSaving(true);
        try {
            await new Promise(r => setTimeout(r, 900));
            toast.success('Company profile updated!');
            setCompanyData(data);
        } catch {
            toast.error('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 size={28} className="spinner" color="var(--primary)" />
        </div>
    );

    return (
        <Section title="Company Profile" subtitle="Update your company information and branding">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                    <Field label="Company Name *" error={errors.name?.message}>
                        <input className={`form-input${errors.name ? ' error' : ''}`} placeholder="Acme Corp" {...register('name')} />
                    </Field>
                    <Field label="Email *" error={errors.email?.message}>
                        <input className={`form-input${errors.email ? ' error' : ''}`} type="email" placeholder="contact@company.com" {...register('email')} />
                    </Field>
                    <Field label="Phone" error={errors.phone?.message}>
                        <input className="form-input" placeholder="+1 234 567 890" {...register('phone')} />
                    </Field>
                    <Field label="Website" error={errors.website?.message}>
                        <input className={`form-input${errors.website ? ' error' : ''}`} placeholder="https://yourcompany.com" {...register('website')} />
                    </Field>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Field label="Address" error={errors.address?.message}>
                            <input className="form-input" placeholder="Street address" {...register('address')} />
                        </Field>
                    </div>
                    <Field label="City" error={errors.city?.message}>
                        <input className="form-input" placeholder="City" {...register('city')} />
                    </Field>
                    <Field label="Country" error={errors.country?.message}>
                        <input className="form-input" placeholder="Country" {...register('country')} />
                    </Field>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => reset(companyData || undefined)}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={!isDirty || isSaving}>
                        {isSaving ? <><Loader2 size={15} className="spinner" /> Saving…</> : <><Save size={15} /> Save Changes</>}
                    </button>
                </div>
            </form>
        </Section>
    );
}

/* ─── User Settings ────────────────────────────────────────────── */
function UserSettingsTab() {
    const user = useAuthStore(s => s.user);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user?.firstName || '', lastName: user?.lastName || '',
            email: user?.email || '', phone: '',
        },
    });

    const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

    const onSaveProfile = async (data: ProfileFormData) => {
        setIsSavingProfile(true);
        try {
            await new Promise(r => setTimeout(r, 900));
            toast.success('Profile updated!');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const onChangePassword = async (_data: PasswordFormData) => {
        setIsSavingPassword(true);
        try {
            await new Promise(r => setTimeout(r, 900));
            toast.success('Password changed!');
            passwordForm.reset();
        } catch {
            toast.error('Failed to change password');
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <>
            <Section title="Profile Information" subtitle="Update your name, email and contact details">
                <form onSubmit={profileForm.handleSubmit(onSaveProfile)}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                        <Field label="First Name *" error={profileForm.formState.errors.firstName?.message}>
                            <input className="form-input" {...profileForm.register('firstName')} />
                        </Field>
                        <Field label="Last Name *" error={profileForm.formState.errors.lastName?.message}>
                            <input className="form-input" {...profileForm.register('lastName')} />
                        </Field>
                        <Field label="Email *" error={profileForm.formState.errors.email?.message}>
                            <input className="form-input" type="email" {...profileForm.register('email')} />
                        </Field>
                        <Field label="Phone">
                            <input className="form-input" placeholder="+1 234 567 890" {...profileForm.register('phone')} />
                        </Field>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
                        <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                            {isSavingProfile ? <><Loader2 size={15} className="spinner" /> Saving…</> : <><Save size={15} /> Save Profile</>}
                        </button>
                    </div>
                </form>
            </Section>

            <Divider />

            <Section title="Change Password" subtitle="Use a strong password you don't use elsewhere">
                <form onSubmit={passwordForm.handleSubmit(onChangePassword)}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                        <Field label="Current Password *" error={passwordForm.formState.errors.currentPassword?.message}>
                            <div className="input-wrapper">
                                <input
                                    className="form-input"
                                    type={showCurrent ? 'text' : 'password'}
                                    style={{ paddingRight: 40 }}
                                    {...passwordForm.register('currentPassword')}
                                />
                                <button type="button" className="input-btn-right" onClick={() => setShowCurrent(v => !v)}>
                                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </Field>
                        <div />
                        <Field label="New Password *" error={passwordForm.formState.errors.newPassword?.message}>
                            <div className="input-wrapper">
                                <input
                                    className="form-input"
                                    type={showNew ? 'text' : 'password'}
                                    style={{ paddingRight: 40 }}
                                    {...passwordForm.register('newPassword')}
                                />
                                <button type="button" className="input-btn-right" onClick={() => setShowNew(v => !v)}>
                                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </Field>
                        <Field label="Confirm Password *" error={passwordForm.formState.errors.confirmPassword?.message}>
                            <input className="form-input" type="password" {...passwordForm.register('confirmPassword')} />
                        </Field>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}>
                        <button type="submit" className="btn btn-primary" disabled={isSavingPassword}>
                            {isSavingPassword ? <><Loader2 size={15} className="spinner" /> Changing…</> : 'Change Password'}
                        </button>
                    </div>
                </form>
            </Section>
        </>
    );
}

/* ─── Leave Types ──────────────────────────────────────────────── */
interface LeaveType {
    id: string; name: string; code: string;
    daysAllowed: number; carryForward: boolean; isActive: boolean;
}

function LeaveTypesTab() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([
        { id: '1', name: 'Annual Leave', code: 'AL', daysAllowed: 21, carryForward: true, isActive: true },
        { id: '2', name: 'Sick Leave', code: 'SL', daysAllowed: 12, carryForward: false, isActive: true },
        { id: '3', name: 'Casual Leave', code: 'CL', daysAllowed: 6, carryForward: false, isActive: true },
        { id: '4', name: 'Maternity Leave', code: 'ML', daysAllowed: 90, carryForward: false, isActive: true },
    ]);
    const [isAdding, setIsAdding] = useState(false);
    const [newType, setNewType] = useState({ name: '', code: '', daysAllowed: 0, carryForward: false });

    const handleAdd = () => {
        if (!newType.name || !newType.code) { toast.error('Name and code are required'); return; }
        setLeaveTypes([...leaveTypes, { id: Date.now().toString(), ...newType, isActive: true }]);
        setNewType({ name: '', code: '', daysAllowed: 0, carryForward: false });
        setIsAdding(false);
        toast.success('Leave type added!');
    };

    return (
        <Section
            title="Leave Types"
            subtitle="Configure leave categories available for employees"
            action={
                <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}>
                    <Plus size={13} /> Add Type
                </button>
            }
        >
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Days Allowed</th>
                            <th>Carry Forward</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isAdding && (
                            <tr>
                                <td>
                                    <input
                                        className="form-input"
                                        style={{ fontSize: 13, padding: '7px 12px' }}
                                        value={newType.name}
                                        onChange={e => setNewType({ ...newType, name: e.target.value })}
                                        placeholder="e.g. Paternity Leave"
                                        autoFocus
                                    />
                                </td>
                                <td>
                                    <input
                                        className="form-input"
                                        style={{ fontSize: 12, padding: '7px 12px', width: 70, fontFamily: 'monospace' }}
                                        value={newType.code}
                                        onChange={e => setNewType({ ...newType, code: e.target.value.toUpperCase() })}
                                        placeholder="PL"
                                        maxLength={5}
                                    />
                                </td>
                                <td>
                                    <input
                                        className="form-input"
                                        type="number"
                                        style={{ fontSize: 13, padding: '7px 12px', width: 80 }}
                                        value={newType.daysAllowed}
                                        onChange={e => setNewType({ ...newType, daysAllowed: parseInt(e.target.value) || 0 })}
                                        min={0}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={newType.carryForward}
                                        onChange={e => setNewType({ ...newType, carryForward: e.target.checked })}
                                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                                    />
                                </td>
                                <td>—</td>
                                <td>
                                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                        <button className="btn btn-primary btn-sm btn-icon-only" onClick={handleAdd} title="Save">
                                            <Check size={13} />
                                        </button>
                                        <button className="btn btn-ghost btn-sm btn-icon-only" onClick={() => setIsAdding(false)} title="Cancel">
                                            <X size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {leaveTypes.map(lt => (
                            <tr key={lt.id} style={!lt.isActive ? { opacity: 0.5 } : {}}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lt.name}</td>
                                <td>
                                    <code style={{ background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>
                                        {lt.code}
                                    </code>
                                </td>
                                <td style={{ fontWeight: 600 }}>{lt.daysAllowed} days</td>
                                <td>
                                    {lt.carryForward
                                        ? <span className="badge badge-green">Yes</span>
                                        : <span className="badge badge-gray">No</span>
                                    }
                                </td>
                                <td>
                                    <span className={`badge ${lt.isActive ? 'badge-green' : 'badge-gray'}`}>
                                        <span className="badge-dot" />
                                        {lt.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn btn-ghost btn-sm btn-icon-only"
                                            title={lt.isActive ? 'Deactivate' : 'Activate'}
                                            onClick={() => setLeaveTypes(prev => prev.map(t => t.id === lt.id ? { ...t, isActive: !t.isActive } : t))}
                                        >
                                            {lt.isActive ? <X size={13} /> : <Check size={13} />}
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm btn-icon-only"
                                            title="Delete"
                                            onClick={() => { setLeaveTypes(prev => prev.filter(t => t.id !== lt.id)); toast.success('Deleted'); }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Section>
    );
}

/* ─── Holidays ─────────────────────────────────────────────────── */
interface Holiday { id: string; name: string; date: string; type: 'national' | 'optional' | 'company'; }

const HOLIDAY_COLORS: Record<string, { bg: string; color: string }> = {
    national: { bg: 'rgba(220,38,38,0.1)', color: '#dc2626' },
    optional: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    company: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
};

function HolidaysTab() {
    const [holidays, setHolidays] = useState<Holiday[]>([
        { id: '1', name: "New Year's Day", date: '2026-01-01', type: 'national' },
        { id: '2', name: 'Republic Day', date: '2026-01-26', type: 'national' },
        { id: '3', name: 'Good Friday', date: '2026-04-03', type: 'optional' },
        { id: '4', name: 'Independence Day', date: '2026-08-15', type: 'national' },
        { id: '5', name: 'Company Foundation Day', date: '2026-03-15', type: 'company' },
    ]);
    const [isAdding, setIsAdding] = useState(false);
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'company' as Holiday['type'] });

    const handleAdd = () => {
        if (!newHoliday.name || !newHoliday.date) { toast.error('Name and date are required'); return; }
        setHolidays([...holidays, { id: Date.now().toString(), ...newHoliday }].sort((a, b) => a.date.localeCompare(b.date)));
        setNewHoliday({ name: '', date: '', type: 'company' });
        setIsAdding(false);
        toast.success('Holiday added!');
    };

    return (
        <Section
            title="Company Holidays"
            subtitle="Manage the holiday calendar for your organisation"
            action={
                <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}>
                    <Plus size={13} /> Add Holiday
                </button>
            }
        >
            {/* Add form */}
            {isAdding && (
                <div style={{
                    background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px', marginBottom: 20,
                    display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap',
                }}>
                    <div className="form-group" style={{ flex: 2, minWidth: 180, margin: 0 }}>
                        <label className="form-label">Holiday Name</label>
                        <input
                            className="form-input"
                            value={newHoliday.name}
                            onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                            placeholder="e.g. Diwali"
                            autoFocus
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={newHoliday.date}
                            onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Type</label>
                        <select
                            className="form-input"
                            value={newHoliday.type}
                            onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value as Holiday['type'] })}
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="national">National</option>
                            <option value="optional">Optional</option>
                            <option value="company">Company</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleAdd}><Check size={14} /> Add</button>
                    <button className="btn btn-ghost" onClick={() => setIsAdding(false)}><X size={14} /></button>
                </div>
            )}

            {/* Holiday grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {holidays.map(h => {
                    const d = new Date(h.date);
                    const typeStyle = HOLIDAY_COLORS[h.type] ?? HOLIDAY_COLORS.company;
                    return (
                        <div key={h.id} style={{
                            background: 'var(--bg-white)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                            display: 'flex', alignItems: 'center', gap: 14,
                            boxShadow: 'var(--shadow-xs)',
                        }}>
                            {/* Date block */}
                            <div style={{
                                background: 'var(--primary)', color: 'white',
                                borderRadius: 'var(--radius)', padding: '8px 12px',
                                textAlign: 'center', minWidth: 52, flexShrink: 0,
                            }}>
                                <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
                                    {d.getDate()}
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', opacity: 0.85, marginTop: 2 }}>
                                    {d.toLocaleString('default', { month: 'short' })}
                                </div>
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>
                                    {h.name}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                                    {d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                                </div>
                                <span style={{
                                    padding: '3px 9px', borderRadius: 'var(--radius-full)',
                                    fontSize: 11, fontWeight: 700, textTransform: 'capitalize' as const,
                                    background: typeStyle.bg, color: typeStyle.color,
                                }}>
                                    {h.type}
                                </span>
                            </div>

                            <button
                                className="btn btn-danger btn-sm btn-icon-only"
                                onClick={() => { setHolidays(prev => prev.filter(x => x.id !== h.id)); toast.success('Holiday removed'); }}
                                title="Remove"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}
