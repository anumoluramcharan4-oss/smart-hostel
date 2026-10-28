import React, { useState } from 'react'
import { User, Mail, Phone, Building, Calendar, ShieldCheck, HeartPulse, FileText, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { useToast } from '@/app/ToastContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'

export const MyProfilePage: React.FC = () => {
  const { user } = useAuth()
  const { success } = useToast()
  const [phone, setPhone] = useState(user?.phone || '+91 91234 56789')
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyContact?.phone || '+91 91234 56700')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      success('Contact details updated successfully')
    }, 400)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          My Student Profile
        </h1>
        <p className="text-xs text-slate-500">
          Personal identification, hostel allocation, and emergency contacts
        </p>
      </div>

      {/* Main Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar name={user?.name || ''} src={user?.avatarUrl} size="xl" status="online" />
          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {user?.name}
              </h2>
              <Badge variant="success">Active Hosteller</Badge>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Student ID: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{user?.studentId || 'IT2023-042'}</span> • {user?.department} (Year {user?.year})
            </p>
            <p className="text-xs text-slate-400">
              Allocated Room: <strong className="text-slate-800 dark:text-slate-200">{user?.roomNumber}</strong> in {user?.blockName}
            </p>
          </div>
        </div>
      </Card>

      {/* Academic & Residency Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact & Emergency Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Registered University Email"
                value={user?.email}
                disabled
                leftIcon={<Mail className="w-4 h-4" />}
                helperText="Email is managed by university IT administrators."
              />

              <Input
                label="Mobile Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
              />

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  Primary Emergency Contact
                </span>

                <Input
                  label="Guardian Name & Relation"
                  value={`${user?.emergencyContact?.name || 'Mukesh Patel'} (${user?.emergencyContact?.relation || 'Father'})`}
                  disabled
                />
                <div className="mt-2">
                  <Input
                    label="Guardian Contact Phone"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" size="sm" isLoading={isSaving}>
                Save Contact Updates
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Hostel Rules & Safety Compliance */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Safety & Regulations Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Hostel Code of Conduct Signed
                </span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Acknowledged digital handbook terms on 2026-08-01.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h5 className="font-bold text-slate-800 dark:text-slate-200">Key Stay Policies</h5>
              <ul className="space-y-1.5 text-slate-500 dark:text-slate-400 list-disc pl-4 text-[11px]">
                <li>Strict night gate locking at 10:00 PM.</li>
                <li>Immersion heating coils and high wattage stoves prohibited.</li>
                <li>Approved outpass mandatory for overnight leaves.</li>
                <li>Quiet study hours enforced from 11:00 PM to 6:00 AM.</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Disciplinary Record
              </span>
              <p className="text-[11px] text-slate-500">
                Clean standing. Zero rule violation notices or fines recorded.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
