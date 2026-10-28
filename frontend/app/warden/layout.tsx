'use client'

import React from 'react'
import { ProtectedRoute } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function WardenLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="warden">
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  )
}
