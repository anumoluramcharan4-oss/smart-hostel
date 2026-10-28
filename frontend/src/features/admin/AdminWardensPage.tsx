import React, { useEffect, useState } from 'react'
import { Shield, Mail, Phone, Building, Briefcase, PlusCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

interface WardenRecord {
  id: string
  name: string
  email: string
  phone: string
  blockAssigned: string
  experienceYears: number
  office: string
}

export const AdminWardensPage: React.FC = () => {
  const [wardens, setWardens] = useState<WardenRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getWardens().then((data) => {
      setWardens(data)
      setLoading(false)
    }).catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Hostel Wardens & Faculty In-Charge
          </h1>
          <p className="text-xs text-slate-500">
            Block assignments, duty schedules, and escalation officers
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => alert('Warden invite system is configured via university SSO directory.')}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Assign New Warden
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wardens.map((w) => (
          <Card key={w.id} className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={w.name} size="md" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{w.name}</h3>
                  <p className="text-[11px] text-slate-500">{w.experienceYears} Years Experience</p>
                </div>
              </div>
              <Badge variant="success" size="sm">Active Duty</Badge>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Assigned: <strong>{w.blockAssigned}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Office: {w.office}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {w.email}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3" />
                {w.phone}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
