import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Clock, Calendar,
    Building2, LogOut, Menu, X, BarChart, Settings, Coins, HelpCircle,
    ChevronLeft
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const NAV_MAIN = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    {
        to: '/employees', icon: Users, label: 'Employees',
        roles: ['super_admin', 'company_admin', 'hr_manager', 'manager']
    },
    { to: '/attendance', icon: Clock, label: 'Attendance' },
    { to: '/leaves', icon: Calendar, label: 'Leaves' },
    {
        to: '/departments', icon: Building2, label: 'Departments',
        roles: ['super_admin', 'company_admin', 'hr_manager', 'manager']
    },
    {
        to: '/reports', icon: BarChart, label: 'Reports',
        roles: ['super_admin', 'company_admin', 'hr_manager', 'manager']
    },
    {
        to: '/payroll', icon: Coins, label: 'Payroll',
        roles: ['super_admin', 'company_admin', 'hr_manager']
    },
];

const NAV_SYSTEM = [
    {
        to: '/settings', icon: Settings, label: 'Settings',
        roles: ['super_admin', 'company_admin']
    },
    { to: '/help', icon: HelpCircle, label: 'Help Center' },
];

function getAvatarColor(name: string): string {
    const colors = [
        'linear-gradient(135deg,#0d968b,#065f5a)',
        'linear-gradient(135deg,#7c3aed,#5b21b6)',
        'linear-gradient(135deg,#3b82f6,#1d4ed8)',
        'linear-gradient(135deg,#10b981,#059669)',
        'linear-gradient(135deg,#f59e0b,#d97706)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const filterNav = (items: typeof NAV_MAIN) =>
        items.filter(item => !item.roles || (user && item.roles.includes(user.role)));

    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`;
    const avatarBg = getAvatarColor(fullName);

    return (
        <div className={`dashboard-layout${collapsed ? ' sidebar-collapsed' : ''}`}>
            <aside className="sidebar">
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Users size={20} />
                    </div>
                    {!collapsed && (
                        <span className="sidebar-logo-text">
                            People<span>OS</span>
                        </span>
                    )}
                    <button
                        className="sidebar-toggle"
                        onClick={() => setCollapsed(c => !c)}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {!collapsed && <div className="sidebar-section-label">Main Menu</div>}

                    {filterNav(NAV_MAIN).map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon size={18} />
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}

                    {!collapsed && <div className="sidebar-section-label" style={{ marginTop: 8 }}>System</div>}
                    {collapsed && <div style={{ height: 8 }} />}

                    {filterNav(NAV_SYSTEM).map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon size={18} />
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user" title={collapsed ? fullName : undefined}>
                        <div
                            className="sidebar-user-avatar"
                            style={{ background: avatarBg }}
                        >
                            {initials}
                        </div>
                        {!collapsed && (
                            <div className="sidebar-user-info">
                                <span className="sidebar-user-name">{fullName}</span>
                                <span className="sidebar-user-role">
                                    {user?.role?.replace(/_/g, ' ')}
                                </span>
                            </div>
                        )}
                    </div>

                    <button
                        className="sidebar-logout"
                        onClick={handleLogout}
                        title={collapsed ? 'Logout' : undefined}
                    >
                        <LogOut size={16} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
