import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Clock, Calendar,
    Building2, LogOut, Menu, X, BarChart, Settings, Coins
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        {
            to: '/employees',
            icon: Users,
            label: 'Employees',
            roles: ['super_admin', 'company_admin', 'hr_manager', 'manager']
        },
        { to: '/attendance', icon: Clock, label: 'Attendance' },
        { to: '/leaves', icon: Calendar, label: 'Leaves' },
        {
            to: '/departments',
            icon: Building2,
            label: 'Departments',
            roles: ['super_admin', 'company_admin', 'hr_manager', 'manager']
        },
        {
            to: '/reports',
            icon: BarChart,
            label: 'Reports',
            roles: ['super_admin', 'company_admin', 'hr_manager', 'manager']
        },
        {
            to: '/payroll',
            icon: Coins,
            label: 'Payroll',
            roles: ['super_admin', 'company_admin', 'hr_manager']
        },
        {
            to: '/settings',
            icon: Settings,
            label: 'Settings',
            roles: ['super_admin', 'company_admin']
        }
    ];

    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true;
        return user && item.roles.includes(user.role);
    });

    return (
        <div className={`dashboard-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-section">
                        <span className="logo-icon">👥</span>
                        {sidebarOpen && <span className="logo-text">HR System</span>}
                    </div>
                    <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {filteredNavItems.map((item) => (
                        <NavLink key={item.to} to={item.to} className="nav-item">
                            <item.icon size={22} />
                            {sidebarOpen && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        {sidebarOpen && (
                            <div className="user-details">
                                <span className="user-name">{user?.firstName} {user?.lastName}</span>
                                <span className="user-role">{user?.role?.replace('_', ' ')}</span>
                            </div>
                        )}
                    </div>
                    <button className="logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
