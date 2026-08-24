import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { RegistrationPage } from './pages/RegistrationPage'
import { RegistrationSuccessPage } from './pages/RegistrationSuccessPage'
import { RegistrationConfirmedPage } from './pages/RegistrationConfirmedPage'
import { VerifyPage } from './pages/VerifyPage'
import { LoginPage } from './pages/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Personnel-facing routes (no nav bar) ── */}
        <Route path="/register" element={<RegistrationPage />} />
        <Route
          path="/registration-success/:registrationId"
          element={<RegistrationSuccessPage />}
        />
        <Route
          path="/registration-confirmed/:registrationId"
          element={<RegistrationConfirmedPage />}
        />
        <Route path="/login" element={<LoginPage />} />

        {/* ── Admin routes (with nav shell & protected) ── */}
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
          path="/verify"
          element={
            <ProtectedRoute>
              <AppShell>
                <VerifyPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* ── Default ── */}
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </BrowserRouter>
  )
}


