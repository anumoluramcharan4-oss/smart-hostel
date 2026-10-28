'use client'

import React from 'react'
import { ProtectedRoute } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="student">
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  )
}
