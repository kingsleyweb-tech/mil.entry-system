import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { AdminRegistrationsPage } from './pages/AdminRegistrationsPage'
import { ReportsPage } from './pages/ReportsPage'
import { FormBuilderPage } from './pages/FormBuilderPage'
import { SettingsPage } from './pages/SettingsPage'
import { RegistrationPage } from './pages/RegistrationPage'
import { RegistrationSuccessPage } from './pages/RegistrationSuccessPage'
import { RegistrationConfirmedPage } from './pages/RegistrationConfirmedPage'
import { VerifyPage } from './pages/VerifyPage'
import { LoginPage } from './pages/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { QrPassPage } from './pages/QrPassPage'

function DefaultRedirect() {
  const token = localStorage.getItem('adminToken')
  if (token) {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to="/register" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Personnel-Facing Routes */}
        <Route path="/register" element={<RegistrationPage />} />
        <Route
          path="/registration-success/:registrationId"
          element={<RegistrationSuccessPage />}
        />
        <Route
          path="/registration-confirmed/:registrationId"
          element={<RegistrationConfirmedPage />}
        />
        <Route path="/pass/:registrationId" element={<QrPassPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/registrations"
          element={
            <ProtectedRoute>
              <AppShell>
                <AdminRegistrationsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify"
          element={
            <ProtectedRoute>
              <AppShell>
                <VerifyPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppShell>
                <ReportsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/form-builder"
          element={
            <ProtectedRoute>
              <AppShell>
                <FormBuilderPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppShell>
                <SettingsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Default & Catch-all Fallbacks */}
        <Route path="/" element={<DefaultRedirect />} />
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
