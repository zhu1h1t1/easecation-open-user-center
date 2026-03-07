// Admin route permission guard
// Checks if user has required permissions before allowing access

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@common/contexts/AuthContext';
import { message } from 'antd';
import { gLang } from '@common/language';

interface AdminRouteGuardProps {
    children: React.ReactNode;
    requiredPermission?: string | string[];
    redirectTo?: string;
}

const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({
    children,
    requiredPermission,
    redirectTo = '/utility-tools',
}) => {
    const [messageApi, contextHolder] = message.useMessage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!user) {
            // User not loaded yet, wait
            return;
        }

        // Check permissions
        if (requiredPermission) {
            const permissions = Array.isArray(requiredPermission)
                ? requiredPermission
                : [requiredPermission];

            const hasPermission = permissions.some(perm => user.permission?.includes(perm));

            if (!hasPermission) {
                // Don't show message for index route redirect
                if (location.pathname !== '/') {
                    messageApi.warning(gLang('adminPermission.insufficient'));
                }
                navigate(redirectTo, { replace: true });
            }
        }
    }, [user, requiredPermission, navigate, redirectTo, location.pathname]);

    // If no user or no permission, show nothing (will redirect)
    if (!user) {
        return <>{contextHolder}</>;
    }

    if (requiredPermission) {
        const permissions = Array.isArray(requiredPermission)
            ? requiredPermission
            : [requiredPermission];

        const hasPermission = permissions.some(perm => user.permission?.includes(perm));

        if (!hasPermission) {
            return <>{contextHolder}</>;
        }
    }

    return (
        <>
            {contextHolder}
            {children}
        </>
    );
};

export default AdminRouteGuard;
