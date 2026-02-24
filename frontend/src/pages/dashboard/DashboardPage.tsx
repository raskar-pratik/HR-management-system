import { useEffect, useState } from 'react';
import {
    Users, Clock, Calendar, TrendingUp,
    UserCheck, UserX, Briefcase, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { type AttendanceRecord } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { DashboardSkeleton } from '../../components/Skeleton';

interface DashboardStats {
    totalEmployees: number;
    activeEmployees: number;
    totalDepartments: number;
    pendingLeaves: number;
    presentToday: number;
    attendancePercentage: number;
}

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [clockingIn, setClockingIn] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsRes, attendanceRes] = await Promise.all([
                api.getCompanyStats(),
                api.getTodayAttendance(),
            ]);
            setStats(statsRes.data as unknown as DashboardStats);
            setTodayAttendance(attendanceRes.data);
        } catch (error) {
            toast.error('Failed to load dashboard data');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClockIn = async () => {
        setClockingIn(true);
        try {
            const response = await api.clockIn();
            setTodayAttendance(response.data);
            toast.success('Clocked in successfully!');
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to clock in';
            toast.error(errorMsg);
        } finally {
            setClockingIn(false);
        }
    };

    const handleClockOut = async () => {
        setClockingIn(true);
        try {
            const response = await api.clockOut();
            setTodayAttendance(response.data);
            toast.success('Clocked out successfully!');
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to clock out';
            toast.error(errorMsg);
        } finally {
            setClockingIn(false);
        }
    };

    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="dashboard-page">
            {/* Welcome Section */}
            <div className="welcome-section">
                <div className="welcome-text">
                    <h1>Welcome back, {user?.firstName}! 👋</h1>
                    <p>{currentDate}</p>
                </div>
                <div className="current-time">
                    <Clock size={24} />
                    <span>{currentTime}</span>
                </div>
            </div>

            {/* Clock In/Out Card */}
            <div className="attendance-card">
                <div className="attendance-status">
                    {todayAttendance?.clockIn ? (
                        <>
                            <div className="status-badge clocked-in">
                                <UserCheck size={20} />
                                Clocked In
                            </div>
                            <p className="clock-time">Clock In: {todayAttendance.clockIn}</p>
                            {todayAttendance.clockOut && (
                                <p className="clock-time">Clock Out: {todayAttendance.clockOut}</p>
                            )}
                        </>
                    ) : (
                        <div className="status-badge not-clocked">
                            <UserX size={20} />
                            Not Clocked In
                        </div>
                    )}
                </div>
                <div className="attendance-actions">
                    {!todayAttendance?.clockIn ? (
                        <button
                            className="btn-clock-in"
                            onClick={handleClockIn}
                            disabled={clockingIn}
                        >
                            {clockingIn ? 'Clocking In...' : 'Clock In'}
                        </button>
                    ) : !todayAttendance?.clockOut ? (
                        <button
                            className="btn-clock-out"
                            onClick={handleClockOut}
                            disabled={clockingIn}
                        >
                            {clockingIn ? 'Clocking Out...' : 'Clock Out'}
                        </button>
                    ) : (
                        <span className="completed-text">✓ Work day completed</span>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.totalEmployees || 0}</h3>
                        <p>Total Employees</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <UserCheck size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.activeEmployees || 0}</h3>
                        <p>Active Employees</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple">
                        <Briefcase size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.totalDepartments || 0}</h3>
                        <p>Departments</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.pendingLeaves || 0}</h3>
                        <p>Pending Leaves</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon teal">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.presentToday || 0}</h3>
                        <p>Present Today</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon pink">
                        <AlertCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.attendancePercentage || 0}%</h3>
                        <p>Attendance Rate</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                    <a href="/employees" className="action-btn">
                        <Users size={20} />
                        View Employees
                    </a>
                    <a href="/leaves" className="action-btn">
                        <Calendar size={20} />
                        Manage Leaves
                    </a>
                    <a href="/attendance" className="action-btn">
                        <Clock size={20} />
                        Attendance Report
                    </a>
                </div>
            </div>
        </div>
    );
}
