import { useEffect, useState, useCallback } from 'react';
import {
    Users, Clock, Calendar, TrendingUp,
    UserCheck, Bell, ArrowUpRight, Briefcase, ArrowDownRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    Filler, Tooltip as ChartTooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api, { type AttendanceRecord, type LeaveRequest, type AuditLog } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { DashboardSkeleton } from '../../components/Skeleton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip, Legend);

interface DashboardStats {
    totalEmployees: number;
    activeEmployees: number;
    totalDepartments: number;
    pendingLeaves: number;
    presentToday: number;
    attendancePercentage: number;
}

interface ChartPoint { day: string; rate: number; }

function getAvatarBg(name: string) {
    const colors = ['#0d968b', '#7c3aed', '#3b82f6', '#10b981', '#f59e0b'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
    const initials = name.split(' ').filter(Boolean).map(p => p[0]).join('').toUpperCase().slice(0, 2) || '?';
    return (
        <div className={`avatar avatar-${size}`} style={{ background: getAvatarBg(name) }}>
            {initials}
        </div>
    );
}

function timeAgo(dateStr: string): string {
    const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const h = Math.floor(diffMin / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function buildWeekChart(records: AttendanceRecord[]): ChartPoint[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayRecs = records.filter(r => r.date?.startsWith(dateStr));
        const present = dayRecs.filter(r => ['present', 'late'].includes(r.status)).length;
        return {
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            rate: dayRecs.length > 0 ? Math.round((present / dayRecs.length) * 100) : 0,
        };
    });
}

const STATUS_BADGE: Record<string, string> = {
    pending: 'badge-amber', approved: 'badge-green',
    rejected: 'badge-red', cancelled: 'badge-gray',
};

export default function DashboardPage() {
    const user = useAuthStore(s => s.user);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clockingIn, setClockingIn] = useState(false);

    const loadData = useCallback(async () => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);

        const [statsRes, todayRes, weeklyRes, leavesRes, auditRes] = await Promise.allSettled([
            api.getCompanyStats(),
            api.getTodayAttendance(),
            api.getAttendanceReport({
                startDate: weekStart.toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
            }),
            api.getLeaves({ status: 'pending' }),
            api.getAuditLogs({ limit: 5 }),
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data as unknown as DashboardStats);
        if (todayRes.status === 'fulfilled') setTodayAttendance(todayRes.value.data);
        setChartData(buildWeekChart(weeklyRes.status === 'fulfilled' ? weeklyRes.value.data || [] : []));
        if (leavesRes.status === 'fulfilled') setPendingLeaves((leavesRes.value.data.leaves || []).slice(0, 4));
        if (auditRes.status === 'fulfilled') setAuditLogs((auditRes.value.data.logs || []).slice(0, 4));

        setIsLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleClockIn = async () => {
        setClockingIn(true);
        try { setTodayAttendance((await api.clockIn()).data); }
        catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed to clock in'); }
        finally { setClockingIn(false); }
    };

    const handleClockOut = async () => {
        setClockingIn(true);
        try { setTodayAttendance((await api.clockOut()).data); }
        catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed to clock out'); }
        finally { setClockingIn(false); }
    };

    if (isLoading) return <DashboardSkeleton />;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const hasChartData = chartData.some(d => d.rate > 0);

    const statCards = [
        {
            label: 'Total Employees', value: stats?.totalEmployees ?? 0,
            icon: Users, iconBg: 'rgba(13,150,139,0.1)', iconColor: '#0d968b',
            badge: `${stats?.activeEmployees ?? 0} active`, detail: 'right now', dir: 'up' as const,
        },
        {
            label: 'Present Today', value: stats?.presentToday ?? 0,
            icon: UserCheck, iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10b981',
            badge: `${stats?.attendancePercentage ?? 0}%`, detail: 'attendance rate', dir: 'neutral' as const,
        },
        {
            label: 'Pending Leaves', value: stats?.pendingLeaves ?? 0,
            icon: Calendar, iconBg: 'rgba(245,158,11,0.1)', iconColor: '#f59e0b',
            badge: pendingLeaves.length > 0 ? `${pendingLeaves.length} to review` : 'all clear',
            detail: '', dir: 'neutral' as const,
        },
        {
            label: 'Departments', value: stats?.totalDepartments ?? 0,
            icon: Briefcase, iconBg: 'rgba(124,58,237,0.1)', iconColor: '#7c3aed',
            badge: `${stats?.totalEmployees ?? 0} staff`, detail: 'across all', dir: 'neutral' as const,
        },
    ];

    return (
        <div className="page-wrapper">
            {/* Greeting */}
            <div className="dashboard-greeting">
                <div>
                    <div className="greeting-text">{greeting}, {user?.firstName} 👋</div>
                    <div className="greeting-sub">Here's what's happening with your team today.</div>
                </div>
                <div className="greeting-actions">
                    <span className="greeting-date-badge">{currentDate}</span>
                    <button className="notif-btn" title="Notifications">
                        <Bell size={17} />
                        {(stats?.pendingLeaves ?? 0) > 0 && <span className="notif-dot" />}
                    </button>
                    {!todayAttendance?.clockIn ? (
                        <button className="btn btn-primary" onClick={handleClockIn} disabled={clockingIn}>
                            {clockingIn ? <><Clock size={15} className="spinner" /> Clocking in…</> : <><Clock size={15} /> Clock In</>}
                        </button>
                    ) : !todayAttendance?.clockOut ? (
                        <button className="btn btn-secondary" onClick={handleClockOut} disabled={clockingIn}>
                            {clockingIn ? 'Clocking out…' : 'Clock Out'}
                        </button>
                    ) : (
                        <span className="badge badge-green">✓ Day complete</span>
                    )}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="stat-cards-grid">
                {statCards.map(c => (
                    <div className="stat-card" key={c.label}>
                        <div className="stat-card-header">
                            <span className="stat-card-label">{c.label}</span>
                            <div className="stat-card-icon" style={{ background: c.iconBg }}>
                                <c.icon size={18} color={c.iconColor} />
                            </div>
                        </div>
                        <div className="stat-card-value">{c.value}</div>
                        <div className="stat-card-footer">
                            <span className={`badge-${c.dir}`}>
                                {c.dir === 'up' && <ArrowUpRight size={12} />}
                                {c.dir === 'down' && <ArrowDownRight size={12} />}
                                {c.badge}
                            </span>
                            {c.detail && <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>{c.detail}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="dashboard-grid">
                <div className="dashboard-main">
                    {/* Chart */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <div>
                                <div className="chart-card-title">Attendance Trend</div>
                                <div className="chart-card-sub">Last 7 days · live from attendance records</div>
                            </div>
                        </div>
                        <div style={{ height: 220 }}>
                            {hasChartData ? (
                                <Line
                                    data={{
                                        labels: chartData.map(d => d.day),
                                        datasets: [{
                                            label: 'Attendance %',
                                            data: chartData.map(d => d.rate),
                                            borderColor: '#0d968b',
                                            borderWidth: 2.5,
                                            backgroundColor: 'rgba(13,150,139,0.08)',
                                            fill: true,
                                            tension: 0.4,
                                            pointBackgroundColor: '#0d968b',
                                            pointRadius: 4,
                                            pointHoverRadius: 6,
                                        }],
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: { label: ctx => `${ctx.parsed.y}% attendance` },
                                                bodyFont: { family: 'Manrope', size: 13 },
                                                titleFont: { family: 'Manrope', size: 12 },
                                            },
                                        },
                                        scales: {
                                            x: {
                                                grid: { display: false },
                                                ticks: { font: { family: 'Manrope', size: 12 }, color: '#64748b' },
                                                border: { display: false },
                                            },
                                            y: {
                                                min: 0, max: 100,
                                                grid: { color: '#f1f5f9' },
                                                ticks: {
                                                    font: { family: 'Manrope', size: 12 }, color: '#64748b',
                                                    callback: v => `${v}%`,
                                                },
                                                border: { display: false },
                                            },
                                        },
                                    }}
                                />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 14, fontWeight: 500 }}>
                                    No attendance data for this week yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="side-card">
                        <div className="side-card-header">
                            <span className="side-card-title">Quick Actions</span>
                        </div>
                        <div className="quick-actions-grid">
                            {[
                                { label: 'Add Employee', icon: Users, bg: 'rgba(13,150,139,0.1)', color: '#0d968b', href: '/employees' },
                                { label: 'Run Payroll', icon: TrendingUp, bg: 'rgba(124,58,237,0.1)', color: '#7c3aed', href: '/payroll' },
                                { label: 'Apply Leave', icon: Calendar, bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', href: '/leaves' },
                                { label: 'Reports', icon: Briefcase, bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', href: '/reports' },
                            ].map(a => (
                                <a key={a.label} href={a.href} className="quick-action-btn" style={{ textDecoration: 'none' }}>
                                    <div className="quick-action-icon" style={{ background: a.bg }}>
                                        <a.icon size={15} color={a.color} />
                                    </div>
                                    {a.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="dashboard-side">
                    {/* Leave Requests */}
                    <div className="side-card">
                        <div className="side-card-header">
                            <span className="side-card-title">Pending Requests</span>
                            <a href="/leaves" className="side-card-link">View all</a>
                        </div>
                        {pendingLeaves.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)', fontSize: 13, fontWeight: 500 }}>
                                No pending requests 🎉
                            </div>
                        ) : pendingLeaves.map(req => (
                            <div className="leave-item" key={req.id}>
                                <Avatar name="Employee" size="sm" />
                                <div className="leave-item-info">
                                    <div className="leave-item-name" style={{ textTransform: 'capitalize' }}>
                                        {req.leaveType?.replace(/_/g, ' ')} Leave
                                    </div>
                                    <div className="leave-item-type">
                                        {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        {' – '}
                                        {new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        &nbsp;·&nbsp;{req.totalDays}d
                                    </div>
                                </div>
                                <span className={`badge ${STATUS_BADGE[req.status] || 'badge-gray'}`}>
                                    <span className="badge-dot" />
                                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Audit Log Activity */}
                    <div className="side-card">
                        <div className="side-card-header">
                            <span className="side-card-title">Recent Activity</span>
                            <a href="/audit" className="side-card-link">See all</a>
                        </div>
                        {auditLogs.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)', fontSize: 13, fontWeight: 500 }}>
                                No recent activity
                            </div>
                        ) : auditLogs.map(log => {
                            const actor = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System';
                            const verb = log.action === 'CREATE' ? 'created' : log.action === 'UPDATE' ? 'updated' : log.action === 'DELETE' ? 'deleted' : log.action === 'LOGIN' ? 'logged in' : log.action.toLowerCase();
                            const entity = log.entity?.toLowerCase().replace(/_/g, ' ');
                            return (
                                <div className="activity-item" key={log.id}>
                                    <div className="activity-dot" />
                                    <div>
                                        <div className="activity-text">
                                            <strong>{actor}</strong> {verb} {entity !== 'login' ? entity : ''}
                                        </div>
                                        <div className="activity-time">{timeAgo(log.createdAt)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
