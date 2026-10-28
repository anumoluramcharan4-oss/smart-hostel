import { ComplaintCategory, ComplaintPriority } from './types'

export interface AutoPriorityResult {
  priority: ComplaintPriority
  label: string
  badgeClass: string
  reason: string
  slaHours: number
  slaText: string
}

/**
 * Automatically determines complaint urgency priority based on problem category and defect details.
 * Rule:
 * 1. Electrical issue -> URGENT
 * 2. Water / Plumbing issue -> URGENT
 * 3. Wi-Fi / Internet issue -> HIGH
 * 4. Housekeeping / Cleaning / Mess issue -> MEDIUM
 * 5. Other / Carpentry -> MEDIUM or LOW
 * 6. Safety hazard words (spark, smoke, fire, shock, flood, lockout) -> URGENT
 */
export function determineAutoPriority(
  category: ComplaintCategory | string,
  title: string = '',
  description: string = ''
): AutoPriorityResult {
  const text = `${title} ${description}`.toLowerCase()
  const cat = (category || '').toLowerCase()

  // 1. Extreme safety / hazard words -> Always URGENT
  if (
    text.includes('spark') ||
    text.includes('smoke') ||
    text.includes('shock') ||
    text.includes('burning') ||
    text.includes('fire') ||
    text.includes('flame') ||
    text.includes('blast') ||
    text.includes('flood') ||
    text.includes('locked out') ||
    text.includes('jammed door') ||
    text.includes('burst pipe')
  ) {
    return {
      priority: 'urgent',
      label: 'Urgent (Hazard Detected)',
      badgeClass: 'bg-rose-500/15 text-rose-500 border border-rose-500/30',
      reason: 'Safety Hazard Detected: Automatic emergency escalation (< 2h SLA).',
      slaHours: 2,
      slaText: '2h SLA',
    }
  }

  // 2. Electrical issues -> Always URGENT
  if (
    cat === 'electrical' ||
    cat.includes('elect') ||
    text.includes('mcb') ||
    text.includes('short circuit') ||
    text.includes('power cut') ||
    text.includes('geyser tripping') ||
    text.includes('switchboard')
  ) {
    return {
      priority: 'urgent',
      label: 'Urgent',
      badgeClass: 'bg-rose-500/15 text-rose-500 border border-rose-500/30',
      reason: 'Electrical Hazard Rule: Electrical faults carry shock/fire risk and are automatically Urgent.',
      slaHours: 4,
      slaText: '4h SLA',
    }
  }

  // 3. Water / Plumbing issues -> Always URGENT
  if (
    cat === 'plumbing' ||
    cat.includes('water') ||
    cat.includes('plumb') ||
    text.includes('leak') ||
    text.includes('overflow') ||
    text.includes('no water') ||
    text.includes('pipe') ||
    text.includes('flush valve') ||
    text.includes('tap broken')
  ) {
    return {
      priority: 'urgent',
      label: 'Urgent',
      badgeClass: 'bg-rose-500/15 text-rose-500 border border-rose-500/30',
      reason: 'Water & Plumbing Rule: Water defects are automatically Urgent to prevent flooding & health risks.',
      slaHours: 4,
      slaText: '4h SLA',
    }
  }

  // 4. Wi-Fi & Network issues -> HIGH
  if (
    cat === 'wifi' ||
    cat.includes('net') ||
    cat.includes('wifi') ||
    cat.includes('lan') ||
    text.includes('router') ||
    text.includes('access point') ||
    text.includes('internet') ||
    text.includes('wifi')
  ) {
    return {
      priority: 'high',
      label: 'High Priority',
      badgeClass: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
      reason: 'Campus Network Rule: Wi-Fi connectivity defects are classified as High priority.',
      slaHours: 24,
      slaText: '24h SLA',
    }
  }

  // 5. Housekeeping, Cleaning & Mess -> MEDIUM
  if (
    cat === 'cleaning' ||
    cat === 'mess' ||
    cat.includes('housekeep') ||
    text.includes('cleaning') ||
    text.includes('dustbin') ||
    text.includes('trash') ||
    text.includes('mop') ||
    text.includes('mess')
  ) {
    return {
      priority: 'medium',
      label: 'Medium Priority',
      badgeClass: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
      reason: 'Housekeeping Rule: Sanitation and mess queues are classified as Medium priority.',
      slaHours: 48,
      slaText: '48h SLA',
    }
  }

  // 6. Carpentry / Furniture -> MEDIUM
  if (cat === 'carpentry' || text.includes('chair') || text.includes('table') || text.includes('bed')) {
    return {
      priority: 'medium',
      label: 'Medium Priority',
      badgeClass: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
      reason: 'Carpentry Rule: Scheduled for standard workshop queue.',
      slaHours: 48,
      slaText: '48h SLA',
    }
  }

  return {
    priority: 'low',
    label: 'Low (Standard)',
    badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    reason: 'Standard routine ticket: addressed in regular facilities cycle.',
    slaHours: 72,
    slaText: '72h SLA',
  }
}
