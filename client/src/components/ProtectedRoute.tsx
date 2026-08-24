import { Navigate } from 'react-router-dom'
import type React from 'react'

type Props = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const token = localStorage.getItem('adminToken')

  if (!token) {
    // Redirect them to the /login page if not logged in
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
