'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClipboardCheck,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Calendar,
  Building,
  Wrench,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function RoomInspectionsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'inspections' | 'schedule' | 'execute'>('inspections')
  const [selectedBlock, setSelectedBlock] = useState('all')
  const [activeInspection, setActiveInspection] = useState<any>(null)

  // Scheduling Form
  const [scheduleData, setScheduleData] = useState({
    block: 'Block A',
    floor: 2,
    room_number: '204',
    inspector_id: 'WAR001',
    inspector_name: 'Warden Dave',
    scheduled_date: new Date().toISOString().split('T')[0],
    general_notes: 'Weekly hygiene and fixtures evaluation',
  })

  // Execution Form Checklist States
  const [execCriteria, setExecCriteria] = useState([
    { criterion_name: 'Floor Sweep & Mop Cleanliness', category: 'CLEANLINESS', result: 'PASS', notes: '' },
    { criterion_name: 'Waste Disposal & Dustbin Clearance', category: 'CLEANLINESS', result: 'PASS', notes: '' },
    { criterion_name: 'Bathroom & Toilet Hygiene', category: 'CLEANLINESS', result: 'PASS', notes: '' },
    { criterion_name: 'Ceiling Lights & Fans Operational', category: 'ELECTRICAL', result: 'PASS', notes: '' },
    { criterion_name: 'Study Desk & Chair Condition', category: 'FURNITURE', result: 'PASS', notes: '' },
    { criterion_name: 'Plumbing Fixtures & Tap Leakage', category: 'PLUMBING', result: 'PASS', notes: '' },
  ])
  const [execNotes, setExecNotes] = useState('')

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['inspection-stats'],
    queryFn: () => api.getInspectionStats(),
    refetchInterval: 5000,
  })

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['inspections-list', selectedBlock],
    queryFn: () => api.getInspections({ block: selectedBlock }),
    refetchInterval: 4000,
  })

  // Mutations
  const scheduleMutation = useMutation({
    mutationFn: (data: any) => api.scheduleInspection(data, 'warden'),
    onSuccess: (data) => {
      toast.success(`Inspection ${data.inspection_ref} scheduled for Room ${data.room_number}`)
      queryClient.invalidateQueries({ queryKey: ['inspections-list'] })
      queryClient.invalidateQueries({ queryKey: ['inspection-stats'] })
      setActiveTab('inspections')
    },
    onError: (err: any) => toast.error(err.message || 'Scheduling failed'),
  })

  const submitMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.submitInspection(id, payload, 'warden'),
    onSuccess: (data) => {
      toast.success(
        `Audit Completed! Cleanliness Score: ${data.cleanliness_score}% (${data.overall_result}). ${data.corrective_actions?.length || 0} corrective action(s) dispatched.`
      )
      queryClient.invalidateQueries({ queryKey: ['inspections-list'] })
      queryClient.invalidateQueries({ queryKey: ['inspection-stats'] })
      setActiveInspection(null)
      setActiveTab('inspections')
    },
    onError: (err: any) => toast.error(err.message || 'Inspection submission failed'),
  })

  const handleStartInspection = (insp: any) => {
    setActiveInspection(insp)
    setActiveTab('execute')
  }

  const handleCriterionResultChange = (index: number, result: string) => {
    setExecCriteria((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], result }
      return copy
    })
  }

  const handleCriterionNotesChange = (index: number, notes: string) => {
    setExecCriteria((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], notes }
      return copy
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Room Inspection &amp; Cleanliness Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proactive audits, objective scoring formulas, and automated maintenance/housekeeping dispatch.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('schedule')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Schedule Room Audit
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Avg Cleanliness</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats?.average_cleanliness_score ?? 88.5}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Scheduled</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.scheduled_count ?? 0}
            </span>
            <span className="text-xs text-slate-400">audits</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Completed</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.completed_count ?? 0}
            </span>
            <span className="text-xs text-slate-400">inspected</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Needs Follow-Up</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats?.failed_count ?? 0}
            </span>
            <span className="text-xs text-slate-400">actions</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Overdue</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats?.overdue_count ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('inspections')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'inspections'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Inspections Manifest ({inspections.length})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'schedule'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Schedule New Audit
          </button>
          {activeInspection && (
            <button
              onClick={() => setActiveTab('execute')}
              className={`pb-3 border-b-2 transition ${
                activeTab === 'execute'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Execute Audit: {activeInspection.inspection_ref} (Room {activeInspection.room_number})
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Inspection List */}
      {activeTab === 'inspections' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Audit Ref</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Inspector</th>
                    <th className="p-3">Scheduled</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inspections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No inspections scheduled yet. Click &quot;Schedule Room Audit&quot; to begin.
                      </td>
                    </tr>
                  ) : (
                    inspections.map((insp: any) => (
                      <tr key={insp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {insp.inspection_ref}
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {insp.block} • Room {insp.room_number}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{insp.inspector_name}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{insp.scheduled_date}</td>
                        <td className="p-3">
                          {insp.cleanliness_score !== null ? (
                            <span
                              className={`font-bold ${
                                insp.cleanliness_score >= 80
                                  ? 'text-emerald-600'
                                  : insp.cleanliness_score >= 60
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {insp.cleanliness_score}%
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              insp.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : insp.status === 'FOLLOW_UP_REQUIRED'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {insp.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {insp.status === 'SCHEDULED' ? (
                            <button
                              onClick={() => handleStartInspection(insp)}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition"
                            >
                              Execute Audit
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartInspection(insp)}
                              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                            >
                              View Findings
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Schedule Form */}
      {activeTab === 'schedule' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Schedule Room Cleanliness Audit
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Assign warden or inspection officer to evaluate room cleanliness, electrical fixtures, and plumbing.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              scheduleMutation.mutate(scheduleData)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Block *</label>
                <select
                  value={scheduleData.block}
                  onChange={(e) => setScheduleData({ ...scheduleData, block: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold"
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Block D">Block D</option>
                  <option value="Block E">Block E</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 204"
                  value={scheduleData.room_number}
                  onChange={(e) => setScheduleData({ ...scheduleData, room_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Inspector Name *</label>
                <input
                  type="text"
                  required
                  value={scheduleData.inspector_name}
                  onChange={(e) => setScheduleData({ ...scheduleData, inspector_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Audit Date *</label>
                <input
                  type="date"
                  required
                  value={scheduleData.scheduled_date}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={scheduleMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition"
            >
              {scheduleMutation.isPending ? 'Scheduling...' : 'Confirm Inspection Schedule'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Execution Checklist Form */}
      {activeTab === 'execute' && activeInspection && (
        <div className="max-w-3xl mx-auto p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="font-mono text-xs font-bold text-emerald-600">
                {activeInspection.inspection_ref}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Live Audit: {activeInspection.block} • Room {activeInspection.room_number}
              </h3>
              <p className="text-xs text-slate-500">Inspector: {activeInspection.inspector_name}</p>
            </div>

            {activeInspection.cleanliness_score !== null && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Calculated Cleanliness</span>
                <span className="text-xl font-black text-emerald-600">{activeInspection.cleanliness_score}%</span>
              </div>
            )}
          </div>

          {activeInspection.status === 'SCHEDULED' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submitMutation.mutate({
                  id: activeInspection.id,
                  payload: {
                    results: execCriteria,
                    general_notes: execNotes,
                  },
                })
              }}
              className="space-y-4"
            >
              <div className="space-y-3">
                {execCriteria.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {c.category}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {c.criterion_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCriterionResultChange(idx, 'PASS')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            c.result === 'PASS'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 border'
                          }`}
                        >
                          PASS
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCriterionResultChange(idx, 'NEEDS_ATTENTION')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            c.result === 'NEEDS_ATTENTION'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 border'
                          }`}
                        >
                          ATTENTION
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCriterionResultChange(idx, 'FAIL')}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            c.result === 'FAIL'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 border'
                          }`}
                        >
                          FAIL
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCriterionResultChange(idx, 'NOT_APPLICABLE')}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                            c.result === 'NOT_APPLICABLE'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-400 border'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    </div>

                    {c.result !== 'PASS' && c.result !== 'NOT_APPLICABLE' && (
                      <input
                        type="text"
                        placeholder="Add defect notes e.g. Loose switch cover, drain block..."
                        value={c.notes}
                        onChange={(e) => handleCriterionNotesChange(idx, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  General Room Summary &amp; Recommendations
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes for resident and housekeeping supervisor..."
                  value={execNotes}
                  onChange={(e) => setExecNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition"
              >
                {submitMutation.isPending ? 'Evaluating Audit...' : 'Submit Official Audit & Dispatch Tasks'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Audit Findings Summary
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {activeInspection.general_notes || 'No general notes recorded.'}
                </p>
              </div>

              {activeInspection.corrective_actions?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-amber-500" />
                    Automated Corrective Actions Dispatched
                  </h4>
                  <div className="space-y-2">
                    {activeInspection.corrective_actions.map((act: any) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {act.criterion_name}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Assignee: {act.assignee} • Type: {act.action_type}
                          </p>
                        </div>
                        {act.linked_maintenance_ticket_id && (
                          <span className="font-mono text-[10px] font-bold bg-white dark:bg-slate-900 px-2 py-1 rounded border">
                            {act.linked_maintenance_ticket_id}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
