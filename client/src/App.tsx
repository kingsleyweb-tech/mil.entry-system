import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { RegistrationPage } from './pages/RegistrationPage'
import { RegistrationSuccessPage } from './pages/RegistrationSuccessPage'
import { RegistrationConfirmedPage } from './pages/RegistrationConfirmedPage'
import { VerifyPage } from './pages/VerifyPage'

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

        {/* ── Admin routes (with nav shell) ── */}
        <Route
          path="/dashboard"
          element={
            <AppShell>
              <DashboardPage />
            </AppShell>
          }
        />
        <Route
          path="/verify"
          element={
            <AppShell>
              <VerifyPage />
            </AppShell>
          }
        />

        {/* ── Default ── */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

