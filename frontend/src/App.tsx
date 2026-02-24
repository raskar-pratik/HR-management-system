import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Route Guards
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';

import { lazy, Suspense } from 'react';
import Loader from './components/Loader';

// Pages - Lazy Loaded
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const EmployeesPage = lazy(() => import('./pages/employees/EmployeesPage'));
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'));
const LeavesPage = lazy(() => import('./pages/leaves/LeavesPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const AuditLogViewer = lazy(() => import('./components/AuditLogViewer'));
const PayrollPage = lazy(() => import('./pages/payroll/PayrollPage'));

// Styles
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<Loader />}>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/leaves" element={<LeavesPage />} />

                  {/* Manager & HR & Admin Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'hr_manager', 'manager']} />}>
                    <Route path="/employees" element={<EmployeesPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/payroll" element={<PayrollPage />} />
                    <Route path="/departments" element={<DashboardPage />} />
                  </Route>

                  {/* Admin Only Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['super_admin', 'company_admin']} />}>
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/audit" element={<AuditLogViewer />} />
                  </Route>
                </Route>
              </Route>

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>

          <Toaster
            position="top-right"
            gutter={8}
            containerStyle={{
              top: 20,
              right: 20,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                padding: '16px',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#059669',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#059669',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#dc2626',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#dc2626',
                },
              },
              loading: {
                style: {
                  background: '#4f46e5',
                },
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
