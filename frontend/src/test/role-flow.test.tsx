import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/app/AuthContext'
import { ToastProvider } from '@/app/ToastContext'
import { ThemeProvider } from '@/app/ThemeContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { RoleSelectPage } from '@/features/auth/RoleSelectPage'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ComplaintCard } from '@/components/ui/ComplaintCard'
import { StatCard } from '@/components/ui/StatCard'

describe('Smart Hostel UI Components & Authentication Flow', () => {
  it('renders StatCard trend without duplicating the value or percentage', () => {
    const { container } = render(
      <StatCard
        title="Hostel Occupancy"
        value="312 / 360"
        subtext="86.7% capacity occupied"
        trend={{ value: '+4.2%', isPositive: true, label: 'vs last term' }}
      />
    )
    expect(screen.getByText('+4.2%')).toBeDefined()
    expect(screen.getByText('vs last term')).toBeDefined()
    expect(container.textContent).not.toContain('+4.2% +4.2%')
  })
  it('renders StatusBadge with exact status colors', () => {
    const { container, rerender } = render(<StatusBadge status="resolved" />)
    expect(screen.getByText('resolved')).toBeDefined()
    expect(container.firstChild).toHaveClass('text-emerald-700')

    rerender(<StatusBadge status="pending" />)
    expect(screen.getByText('pending')).toBeDefined()
    expect(container.firstChild).toHaveClass('text-amber-700')

    rerender(<StatusBadge status="warning" />)
    expect(screen.getByText('warning')).toBeDefined()
    expect(container.firstChild).toHaveClass('text-orange-700')

    rerender(<StatusBadge status="critical" />)
    expect(screen.getByText('critical')).toBeDefined()
    expect(container.firstChild).toHaveClass('text-rose-700')

    rerender(<StatusBadge status="info" />)
    expect(screen.getByText('info')).toBeDefined()
    expect(container.firstChild).toHaveClass('text-sky-700')
  })

  it('renders ComplaintCard correctly with title and badges', () => {
    const mockComplaint = {
      id: 'cmp-test-1',
      ticketNumber: 'CMP-2026-001',
      studentId: 'stu-1',
      studentName: 'Aarav Patel',
      roomNumber: 'A-204',
      blockName: 'Block A (Newton)',
      category: 'Electrical' as const,
      subItem: 'Ceiling Fan',
      title: 'Ceiling fan regulator sparking',
      description: 'The ceiling fan speed regulator makes popping noise and sparks.',
      priority: 'critical' as const,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [],
      comments: [],
    }

    render(<ComplaintCard complaint={mockComplaint} />)
    expect(screen.getByText('CMP-2026-001')).toBeDefined()
    expect(screen.getByText('Ceiling fan regulator sparking')).toBeDefined()
    expect(screen.getByText('Room A-204')).toBeDefined()
    expect(screen.getByText('Aarav Patel')).toBeDefined()
  })

  it('renders LoginPage with Quick-Fill demo accounts', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <LoginPage />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Sign in to your account')).toBeDefined()
    expect(screen.getByText('demo.all@hostel.dev')).toBeDefined()
    expect(screen.getByText('demo.warden@hostel.dev')).toBeDefined()
    expect(screen.getByText('demo.student@hostel.dev')).toBeDefined()
  })

  it('renders RoleSelectPage with student, warden, and admin workspace portals', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <RoleSelectPage />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Select Your Workspace')).toBeDefined()
    expect(screen.getByText('Student Portal')).toBeDefined()
    expect(screen.getByText('Warden Console')).toBeDefined()
    expect(screen.getByText('Admin Operations')).toBeDefined()
  })
})
