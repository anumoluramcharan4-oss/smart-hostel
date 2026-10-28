import { describe, it, expect, beforeEach } from 'vitest'
import { mockStore } from '@/lib/mock/data'
import { api } from '@/lib/api'

describe('Smart Hostel Mock Store & RBAC Logic', () => {
  it('correctly retrieves default initial user with multi-roles', async () => {
    const user = await api.getCurrentUser()
    expect(user).toBeDefined()
    expect(user.email).toBe('demo.all@hostel.dev')
    expect(user.roles).toContain('admin')
    expect(user.roles).toContain('warden')
    expect(user.roles).toContain('student')
  })

  it('allows switching to a role the user holds', async () => {
    const switched = await api.switchRole('warden')
    expect(switched.activeRole).toBe('warden')

    const switchedStudent = await api.switchRole('student')
    expect(switchedStudent.activeRole).toBe('student')
  })

  it('throws an error when trying to switch to an unauthorized role', async () => {
    // Log in as student-only user
    const studentUser = await api.login('demo.student@hostel.dev')
    expect(studentUser.roles).toEqual(['student'])

    await expect(api.switchRole('admin')).rejects.toThrow(/Unauthorized/)
  })

  it('creates and auto-triages room complaints with AI priority', async () => {
    // Log in as demo student
    await api.login('demo.student@hostel.dev')

    const created = await api.createComplaint({
      category: 'Electrical',
      subItem: 'Switchboard Sparks',
      title: 'Sparks and burning smell from 16A bathroom socket',
      description: 'Major electrical burning hazard with visible sparks!',
    })

    expect(created.ticketNumber).toMatch(/^CMP-2026-/)
    expect(created.priority).toBe('critical')
    expect(created.status).toBe('pending')
    expect(created.timeline.length).toBeGreaterThan(0)
  })

  it('allows wardens to assign staff and update ticket status', async () => {
    // Switch to warden
    await api.login('demo.all@hostel.dev')
    await api.switchRole('warden')

    const complaints = await api.getComplaints()
    const firstComplaint = complaints[0]

    const staffList = await api.getStaff()
    const staff = staffList[0]

    const updated = await api.assignStaffToComplaint(firstComplaint.id, staff.id)
    expect(updated.assignedStaffId).toBe(staff.id)
    expect(updated.status).toBe('in_progress')

    const resolved = await api.updateComplaintStatus(firstComplaint.id, 'resolved', 'Testing complete')
    expect(resolved.status).toBe('resolved')
    expect(resolved.resolvedAt).toBeDefined()
  })

  it('allows students to query the AI Hostel Assistant with citations', async () => {
    const res = await api.queryAssistant('What are the gate opening timings?')
    expect(res.answer).toBeDefined()
    expect(res.citation).toContain('Hostel Handbook')
  })

  it('returns polite fallback when AI Assistant cannot find matching policy', async () => {
    const res = await api.queryAssistant('What is the secret quantum code for the space rocket?')
    expect(res.answer).toContain("I don't know, please contact the warden")
  })

  it('validates role collections for all 3 demo accounts', async () => {
    const allUser = await api.login('demo.all@hostel.dev')
    expect(allUser.roles).toEqual(['student', 'warden', 'admin'])

    const wardenUser = await api.login('demo.warden@hostel.dev')
    expect(wardenUser.roles).toEqual(['student', 'warden'])
    expect(wardenUser.roles).not.toContain('admin')

    const studentUser = await api.login('demo.student@hostel.dev')
    expect(studentUser.roles).toEqual(['student'])
    expect(studentUser.roles).not.toContain('warden')
    expect(studentUser.roles).not.toContain('admin')
  })
})
