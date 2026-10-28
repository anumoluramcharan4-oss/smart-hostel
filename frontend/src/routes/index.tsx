import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleGuard } from './RoleGuard'
import { RoleLayout } from '@/components/layout/RoleLayout'

// Public Features
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RoleSelectPage } from '@/features/auth/RoleSelectPage'
import { ForbiddenPage } from '@/features/auth/ForbiddenPage'
import { NotFoundPage } from '@/features/auth/NotFoundPage'

// Student Features
import { StudentDashboardPage } from '@/features/student/StudentDashboardPage'
import { MyProfilePage } from '@/features/student/MyProfilePage'
import { MyRoomPage } from '@/features/student/MyRoomPage'
import { StudentComplaintsPage } from '@/features/student/StudentComplaintsPage'
import { RaiseComplaintPage } from '@/features/student/RaiseComplaintPage'
import { LeaveOutpassPage } from '@/features/student/LeaveOutpassPage'
import { MessFeedbackPage } from '@/features/student/MessFeedbackPage'
import { StudentAnnouncementsPage } from '@/features/student/StudentAnnouncementsPage'
import { StudentNotificationsPage } from '@/features/student/StudentNotificationsPage'
import { AIAssistantPage } from '@/features/student/AIAssistantPage'

// Warden Features
import { WardenDashboardPage } from '@/features/warden/WardenDashboardPage'
import { WardenStudentsPage } from '@/features/warden/WardenStudentsPage'
import { WardenRoomsPage } from '@/features/warden/WardenRoomsPage'
import { WardenComplaintsPage } from '@/features/warden/WardenComplaintsPage'
import { WardenLeaveRequestsPage } from '@/features/warden/WardenLeaveRequestsPage'
import { WardenMessFeedbackPage } from '@/features/warden/WardenMessFeedbackPage'
import { WardenAnnouncementsPage } from '@/features/warden/WardenAnnouncementsPage'
import { WardenReportsPage } from '@/features/warden/WardenReportsPage'
import { WardenNotificationsPage } from '@/features/warden/WardenNotificationsPage'

// Admin Features
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage'
import { AdminStudentsPage } from '@/features/admin/AdminStudentsPage'
import { AdminWardensPage } from '@/features/admin/AdminWardensPage'
import { AdminUsersPage } from '@/features/admin/AdminUsersPage'
import { AdminHostelsPage } from '@/features/admin/AdminHostelsPage'
import { AdminRoomsPage } from '@/features/admin/AdminRoomsPage'
import { AdminComplaintsPage } from '@/features/admin/AdminComplaintsPage'
import { AdminLeaveRequestsPage } from '@/features/admin/AdminLeaveRequestsPage'
import { AdminMessManagementPage } from '@/features/admin/AdminMessManagementPage'
import { AdminAnnouncementsPage } from '@/features/admin/AdminAnnouncementsPage'
import { AdminAnalyticsPage } from '@/features/admin/AdminAnalyticsPage'
import { AdminReportsPage } from '@/features/admin/AdminReportsPage'
import { AdminSettingsPage } from '@/features/admin/AdminSettingsPage'

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/select-role',
    element: (
      <ProtectedRoute>
        <RoleSelectPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/forbidden',
    element: <ForbiddenPage />,
  },

  // Student Routes (/student/*)
  {
    path: '/student',
    element: (
      <ProtectedRoute>
        <RoleGuard requiredRole="student">
          <RoleLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/student/dashboard" replace /> },
      { path: 'dashboard', element: <StudentDashboardPage /> },
      { path: 'profile', element: <MyProfilePage /> },
      { path: 'room', element: <MyRoomPage /> },
      { path: 'complaints', element: <StudentComplaintsPage /> },
      { path: 'raise-complaint', element: <RaiseComplaintPage /> },
      { path: 'leave', element: <LeaveOutpassPage /> },
      { path: 'mess', element: <MessFeedbackPage /> },
      { path: 'announcements', element: <StudentAnnouncementsPage /> },
      { path: 'notifications', element: <StudentNotificationsPage /> },
      { path: 'assistant', element: <AIAssistantPage /> },
    ],
  },

  // Warden Routes (/warden/*)
  {
    path: '/warden',
    element: (
      <ProtectedRoute>
        <RoleGuard requiredRole="warden">
          <RoleLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/warden/dashboard" replace /> },
      { path: 'dashboard', element: <WardenDashboardPage /> },
      { path: 'students', element: <WardenStudentsPage /> },
      { path: 'rooms', element: <WardenRoomsPage /> },
      { path: 'complaints', element: <WardenComplaintsPage /> },
      { path: 'leave', element: <WardenLeaveRequestsPage /> },
      { path: 'mess', element: <WardenMessFeedbackPage /> },
      { path: 'announcements', element: <WardenAnnouncementsPage /> },
      { path: 'reports', element: <WardenReportsPage /> },
      { path: 'notifications', element: <WardenNotificationsPage /> },
    ],
  },

  // Admin Routes (/admin/*)
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <RoleGuard requiredRole="admin">
          <RoleLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'students', element: <AdminStudentsPage /> },
      { path: 'wardens', element: <AdminWardensPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'hostels', element: <AdminHostelsPage /> },
      { path: 'rooms', element: <AdminRoomsPage /> },
      { path: 'complaints', element: <AdminComplaintsPage /> },
      { path: 'leave', element: <AdminLeaveRequestsPage /> },
      { path: 'mess', element: <AdminMessManagementPage /> },
      { path: 'announcements', element: <AdminAnnouncementsPage /> },
      { path: 'analytics', element: <AdminAnalyticsPage /> },
      { path: 'reports', element: <AdminReportsPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ],
  },

  // Fallback 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
