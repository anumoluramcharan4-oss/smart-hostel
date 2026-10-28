import React, { useEffect, useState } from 'react'
import { Settings, Save, Clock, ShieldAlert, Building, Mail, Phone } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/app/ToastContext'
import type { HostelSettings } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export const AdminSettingsPage: React.FC = () => {
  const { success } = useToast()
  const [settings, setSettings] = useState<HostelSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s)
      setLoading(false)
    }).catch(console.error)
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    setIsSaving(true)
    try {
      const updated = await api.updateSettings(settings)
      setSettings(updated)
      success('System & SLA parameters updated successfully')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || !settings) return null

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Hostel System & Policy Settings
        </h1>
        <p className="text-xs text-slate-500">
          Configure security gate curfews, maintenance SLA targets, and facility contact details
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hostel Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Facility Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Hostel Estate Name"
                value={settings.hostelName}
                onChange={(e) => setSettings({ ...settings, hostelName: e.target.value })}
              />

              <Input
                label="Chief Warden in Charge"
                value={settings.chiefWarden}
                onChange={(e) => setSettings({ ...settings, chiefWarden: e.target.value })}
              />

              <Input
                label="Administrative Email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />

              <Input
                label="Security Control Room Helpline"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Gate Timings & Curfew */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Security Gate Timings & Curfew Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Morning Gate Opening Time"
                value={settings.gateOpeningTime}
                onChange={(e) => setSettings({ ...settings, gateOpeningTime: e.target.value })}
              />

              <Input
                label="Night Gate Lock Time"
                value={settings.gateClosingTime}
                onChange={(e) => setSettings({ ...settings, gateClosingTime: e.target.value })}
              />

              <Input
                label="Final Night Curfew (Biometrics Required)"
                value={settings.nightCurfewTime}
                onChange={(e) => setSettings({ ...settings, nightCurfewTime: e.target.value })}
              />

              <Input
                label="Parent & Visitor Lounge Hours"
                value={settings.guestVisitingHours}
                onChange={(e) => setSettings({ ...settings, guestVisitingHours: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Complaint SLA Standards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Maintenance SLA Standards (Hours to Resolve)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                label="Critical Priority (Hrs)"
                type="number"
                value={settings.complaintSlaHours.critical}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    complaintSlaHours: {
                      ...settings.complaintSlaHours,
                      critical: Number(e.target.value),
                    },
                  })
                }
              />

              <Input
                label="High Priority (Hrs)"
                type="number"
                value={settings.complaintSlaHours.high}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    complaintSlaHours: {
                      ...settings.complaintSlaHours,
                      high: Number(e.target.value),
                    },
                  })
                }
              />

              <Input
                label="Medium Priority (Hrs)"
                type="number"
                value={settings.complaintSlaHours.medium}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    complaintSlaHours: {
                      ...settings.complaintSlaHours,
                      medium: Number(e.target.value),
                    },
                  })
                }
              />

              <Input
                label="Low Priority (Hrs)"
                type="number"
                value={settings.complaintSlaHours.low}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    complaintSlaHours: {
                      ...settings.complaintSlaHours,
                      low: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" size="lg" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
            Save System Configurations
          </Button>
        </div>
      </form>
    </div>
  )
}
