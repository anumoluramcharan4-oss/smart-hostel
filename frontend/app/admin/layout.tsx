'use client'

import React from 'react'
import { ProtectedRoute } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="admin">
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  )
}
