import React from 'react';
import { useAuthStore } from '../store/authStore';

interface RoleGateProps {
    allowedRoles: string[];
    children: React.ReactNode;
}

const RoleGate: React.FC<RoleGateProps> = ({ allowedRoles, children }) => {
    const user = useAuthStore((state) => state.user);

    if (!user || !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
};

export default RoleGate;
