import './Skeleton.css';

// Base skeleton element with shimmer
interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
}

export const Skeleton = ({
    width = '100%',
    height = '16px',
    borderRadius = '4px',
    className = ''
}: SkeletonProps) => (
    <div
        className={`skeleton ${className}`}
        style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            borderRadius
        }}
    />
);

// Circle skeleton for avatars
export const SkeletonCircle = ({ size = 40 }: { size?: number }) => (
    <div
        className="skeleton skeleton-circle"
        style={{ width: size, height: size }}
    />
);

// Text line skeleton
export const SkeletonText = ({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) => (
    <div className="skeleton-text" style={{ gap }}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                width={i === lines - 1 ? '70%' : '100%'}
                height={14}
            />
        ))}
    </div>
);

// Card skeleton
export const SkeletonCard = ({ height = 120 }: { height?: number }) => (
    <div className="skeleton-card" style={{ height }}>
        <div className="skeleton-card-content">
            <SkeletonCircle size={50} />
            <div className="skeleton-card-info">
                <Skeleton width="60%" height={24} />
                <Skeleton width="40%" height={14} />
            </div>
        </div>
    </div>
);

// Stat card skeleton (for dashboard)
export const StatCardSkeleton = () => (
    <div className="stat-card skeleton-stat-card">
        <div className="skeleton-stat-icon">
            <Skeleton width={50} height={50} borderRadius="12px" />
        </div>
        <div className="skeleton-stat-info">
            <Skeleton width="60px" height={28} borderRadius="6px" />
            <Skeleton width="80px" height={14} borderRadius="4px" />
        </div>
    </div>
);

// Attendance card skeleton
export const AttendanceCardSkeleton = () => (
    <div className="attendance-card skeleton-attendance-card">
        <div className="skeleton-attendance-left">
            <Skeleton width="150px" height={16} />
            <Skeleton width="200px" height={32} borderRadius="20px" />
            <Skeleton width="120px" height={14} />
        </div>
        <Skeleton width="140px" height={48} borderRadius="8px" />
    </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ columns = 5 }: { columns?: number }) => (
    <tr className="skeleton-row">
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i}>
                {i === 0 ? (
                    <div className="skeleton-employee-cell">
                        <SkeletonCircle size={40} />
                        <div>
                            <Skeleton width="120px" height={14} />
                            <Skeleton width="80px" height={12} />
                        </div>
                    </div>
                ) : (
                    <Skeleton width={i === columns - 1 ? '60px' : '100px'} height={14} />
                )}
            </td>
        ))}
    </tr>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) => (
    <div className="skeleton-table-container">
        <table className="data-table">
            <thead>
                <tr>
                    {Array.from({ length: columns }).map((_, i) => (
                        <th key={i}>
                            <Skeleton width="80px" height={12} />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={columns} />
                ))}
            </tbody>
        </table>
    </div>
);

// Dashboard skeleton (complete page skeleton)
export const DashboardSkeleton = () => (
    <div className="dashboard-skeleton">
        {/* Welcome section */}
        <div className="welcome-section skeleton-welcome">
            <div className="welcome-text">
                <Skeleton width="250px" height={28} borderRadius="6px" />
                <Skeleton width="180px" height={16} />
            </div>
            <Skeleton width="150px" height={54} borderRadius="12px" />
        </div>

        {/* Attendance card */}
        <AttendanceCardSkeleton />

        {/* Stats grid */}
        <div className="stats-grid">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>

        {/* Quick actions */}
        <div className="quick-actions">
            <Skeleton width="150px" height={24} borderRadius="6px" />
            <div className="action-buttons" style={{ marginTop: 20 }}>
                <Skeleton width="160px" height={50} borderRadius="8px" />
                <Skeleton width="160px" height={50} borderRadius="8px" />
                <Skeleton width="160px" height={50} borderRadius="8px" />
            </div>
        </div>
    </div>
);

// Employee list skeleton
export const EmployeeListSkeleton = () => (
    <div className="employee-list-skeleton">
        {/* Search bar */}
        <div className="search-bar skeleton-search">
            <Skeleton width="100%" height={50} borderRadius="12px" />
        </div>

        {/* Table */}
        <TableSkeleton rows={8} columns={6} />
    </div>
);

// Leave card skeleton
export const LeaveCardSkeleton = () => (
    <div className="leave-card skeleton-leave-card">
        <div className="skeleton-leave-left">
            <div className="skeleton-leave-header">
                <Skeleton width="100px" height={24} borderRadius="12px" />
                <Skeleton width="80px" height={20} borderRadius="10px" />
            </div>
            <Skeleton width="200px" height={14} />
            <Skeleton width="150px" height={12} />
        </div>
        <div className="skeleton-leave-actions">
            <Skeleton width="80px" height={36} borderRadius="6px" />
            <Skeleton width="80px" height={36} borderRadius="6px" />
        </div>
    </div>
);

// Leaves page skeleton
export const LeavesPageSkeleton = () => (
    <div className="leaves-skeleton">
        {/* Leave balance cards */}
        <div className="leave-balances skeleton-balances">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-balance-card">
                    <Skeleton width="80px" height={32} borderRadius="6px" />
                    <Skeleton width="100px" height={14} />
                </div>
            ))}
        </div>

        {/* Leave requests */}
        <div className="skeleton-leave-list">
            {Array.from({ length: 4 }).map((_, i) => (
                <LeaveCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

// Attendance page skeleton
export const AttendancePageSkeleton = () => (
    <div className="attendance-skeleton">
        {/* Month navigation */}
        <div className="skeleton-month-nav">
            <Skeleton width="40px" height={40} borderRadius="8px" />
            <Skeleton width="180px" height={28} borderRadius="6px" />
            <Skeleton width="40px" height={40} borderRadius="8px" />
        </div>

        {/* Summary cards */}
        <div className="skeleton-summary-grid">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-summary-card">
                    <Skeleton width="60px" height={36} borderRadius="6px" />
                    <Skeleton width="80px" height={14} />
                </div>
            ))}
        </div>

        {/* Table */}
        <TableSkeleton rows={10} columns={5} />
    </div>
);

// Payroll page skeleton
export const PayrollPageSkeleton = () => (
    <div className="payroll-skeleton">
        {/* Tab navigation */}
        <div className="skeleton-tabs">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} width="120px" height={42} borderRadius="8px" />
            ))}
        </div>

        {/* Content area */}
        <div className="skeleton-payroll-content">
            {/* Header row */}
            <div className="skeleton-payroll-header">
                <Skeleton width="200px" height={24} borderRadius="6px" />
                <Skeleton width="140px" height={40} borderRadius="8px" />
            </div>

            {/* Table */}
            <TableSkeleton rows={6} columns={5} />
        </div>
    </div>
);

export default {
    Skeleton,
    SkeletonCircle,
    SkeletonText,
    SkeletonCard,
    StatCardSkeleton,
    AttendanceCardSkeleton,
    TableSkeleton,
    DashboardSkeleton,
    EmployeeListSkeleton,
    LeavesPageSkeleton,
    AttendancePageSkeleton,
    PayrollPageSkeleton
};
