import type { ComplaintPriority, ComplaintStatus, LeaveStatus } from '../types'

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString).getTime()
    const now = new Date().getTime()
    const diff = Math.floor((now - d) / 1000)

    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return formatDate(dateString)
  } catch {
    return dateString
  }
}

export function getStatusBadgeVariant(status: ComplaintStatus | LeaveStatus | string): 'success' | 'warning' | 'pending' | 'critical' | 'neutral' {
  switch (status.toLowerCase()) {
    case 'resolved':
    case 'approved':
    case 'available':
      return 'success'
    case 'in_progress':
    case 'partially_occupied':
      return 'warning'
    case 'pending':
    case 'occupied':
      return 'pending'
    case 'critical':
    case 'rejected':
    case 'maintenance':
      return 'critical'
    case 'closed':
    default:
      return 'neutral'
  }
}

export function getPriorityBadgeVariant(priority: ComplaintPriority | string): 'success' | 'warning' | 'pending' | 'critical' {
  switch (priority.toLowerCase()) {
    case 'critical':
      return 'critical'
    case 'high':
      return 'critical'
    case 'medium':
      return 'warning'
    case 'low':
    default:
      return 'pending'
  }
}
