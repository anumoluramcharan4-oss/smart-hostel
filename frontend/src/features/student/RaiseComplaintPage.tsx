import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, Upload, AlertCircle, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useToast } from '@/app/ToastContext'
import { api } from '@/lib/api'
import type { ComplaintCategory, ComplaintPriority } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'

const complaintSchema = z.object({
  category: z.enum([
    'Electrical',
    'Plumbing',
    'Carpentry',
    'Internet/Wi-Fi',
    'Cleanliness',
    'Appliance',
    'Other',
  ]),
  subItem: z.string().min(2, 'Please specify the item/fitting'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(15, 'Please provide more details (at least 15 characters)'),
})

type ComplaintFormData = z.infer<typeof complaintSchema>

const SUB_ITEMS: Record<ComplaintCategory, string[]> = {
  Electrical: ['Ceiling Fan', 'Tube Light / LED Batten', 'Geyser / Water Heater', 'Switchboard / Socket', 'Room MCB'],
  Plumbing: ['Washbasin Leakage', 'Shower Head', 'Flush Tank / Valve', 'Tap Dripping', 'Floor Drain'],
  Carpentry: ['Study Table / Desk', 'Wardrobe Lock', 'Door Latch / Hinges', 'Window Mesh', 'Bed Frame'],
  'Internet/Wi-Fi': ['LAN Port Wall Jack', 'Wi-Fi Signal Strength', 'Authentication Portal', 'IP Allocation'],
  Cleanliness: ['Corridor Floor', 'Common Washroom', 'Dustbin Clearance', 'Window Sills'],
  Appliance: ['Water Cooler Chilling', 'Microwave (Pantry)', 'Ironing Station', 'Vending Machine'],
  Other: ['Pest Control', 'Noise Disturbance', 'Curtain Rod', 'General Maintenance'],
}

export const RaiseComplaintPage: React.FC = () => {
  const navigate = useNavigate()
  const { success } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory>('Electrical')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      category: 'Electrical',
      subItem: 'Ceiling Fan',
      title: '',
      description: '',
    },
  })

  const watchedTitle = watch('title') || ''
  const watchedDesc = watch('description') || ''

  // Real-time Simulated AI Triage Preview with Auto-Category & Priority Detection
  const aiTriage = useMemo(() => {
    const combined = `${watchedTitle} ${watchedDesc}`.toLowerCase()
    let priority: ComplaintPriority = 'medium'
    let suggestedCategory: ComplaintCategory = 'Electrical'
    let suggestedSubItem = 'Ceiling Fan'
    let slaHours = 48
    let alertReason = 'Standard room maintenance triage.'

    if (
      combined.includes('spark') ||
      combined.includes('sparks') ||
      combined.includes('smoke') ||
      combined.includes('burning') ||
      combined.includes('shock') ||
      combined.includes('fire')
    ) {
      priority = 'critical'
      suggestedCategory = 'Electrical'
      suggestedSubItem = 'Switchboard / Socket'
      slaHours = 2
      alertReason = 'Safety Hazard: Electrical sparks detected. Immediate emergency triage applied (2hr SLA).'
    } else if (
      combined.includes('leakage') ||
      combined.includes('leak') ||
      combined.includes('dripping') ||
      combined.includes('no water') ||
      combined.includes('pipe')
    ) {
      priority = 'high'
      suggestedCategory = 'Plumbing'
      suggestedSubItem = 'Washbasin Leakage'
      slaHours = 12
      alertReason = 'High Urgency: Active water leakage detected. Expedited plumbing dispatch (12hr SLA).'
    } else if (
      combined.includes('fan') ||
      combined.includes('speed') ||
      combined.includes('regulator')
    ) {
      priority = 'medium'
      suggestedCategory = 'Electrical'
      suggestedSubItem = 'Ceiling Fan'
      slaHours = 48
      alertReason = 'Medium Urgency: Ceiling fan defect recognized. Standard electrical SLA (48hr).'
    } else if (
      combined.includes('wifi') ||
      combined.includes('internet') ||
      combined.includes('lan')
    ) {
      priority = 'medium'
      suggestedCategory = 'Internet/Wi-Fi'
      suggestedSubItem = 'Wi-Fi Signal Strength'
      slaHours = 24
      alertReason = 'Network connectivity issue detected. IT network ticket created.'
    } else if (
      combined.includes('mesh') ||
      combined.includes('light') ||
      combined.includes('chair') ||
      combined.includes('paint')
    ) {
      priority = 'low'
      suggestedCategory = 'Carpentry'
      suggestedSubItem = 'Window Mesh'
      slaHours = 72
      alertReason = 'Low Urgency: General convenience ticket (72hr SLA).'
    }

    return { priority, suggestedCategory, suggestedSubItem, slaHours, alertReason }
  }, [watchedTitle, watchedDesc])

  const applyAiSuggestion = () => {
    setSelectedCategory(aiTriage.suggestedCategory)
    setValue('category', aiTriage.suggestedCategory)
    setValue('subItem', aiTriage.suggestedSubItem)
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value as ComplaintCategory
    setSelectedCategory(cat)
    setValue('category', cat)
    setValue('subItem', SUB_ITEMS[cat][0])
  }

  const handleSimulatedPhotoUpload = () => {
    setPhotoPreview('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80')
  }

  const onSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true)
    try {
      const created = await api.createComplaint({
        category: data.category,
        subItem: data.subItem,
        title: data.title,
        description: data.description,
        priority: aiTriage.priority,
        photoUrl: photoPreview || undefined,
      })
      success(`Complaint ${created.ticketNumber} registered successfully!`)
      navigate('/student/complaints')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/student/complaints')}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Raise a Room Complaint
          </h1>
          <p className="text-xs text-slate-500">
            Submit an issue with live AI priority and category classification
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Complaint Form (2 cols) */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Select
                  label="Complaint Category"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  options={[
                    { value: 'Electrical', label: 'Electrical (Fan, Geyser, Lights, Switchboards)' },
                    { value: 'Plumbing', label: 'Plumbing (Washbasin, Taps, Showers, Flush)' },
                    { value: 'Carpentry', label: 'Carpentry (Desk, Wardrobe, Door, Window)' },
                    { value: 'Internet/Wi-Fi', label: 'Internet / Wi-Fi (LAN Jack, Coverage)' },
                    { value: 'Cleanliness', label: 'Cleanliness & Housekeeping' },
                    { value: 'Appliance', label: 'Common Appliance (Water Cooler, Microwave)' },
                    { value: 'Other', label: 'Other Facilities' },
                  ]}
                />

                <Select
                  label="Specific Fitting / Sub-Item"
                  {...register('subItem')}
                  error={errors.subItem?.message}
                  options={SUB_ITEMS[selectedCategory].map((sub) => ({
                    value: sub,
                    label: sub,
                  }))}
                />

                <Input
                  label="Complaint Title / Summary"
                  placeholder="e.g. Ceiling fan making loud noise on speed 4"
                  error={errors.title?.message}
                  {...register('title')}
                />

                <Textarea
                  label="Detailed Description"
                  rows={4}
                  placeholder="Describe the issue, when it started, and specific location inside the room..."
                  error={errors.description?.message}
                  {...register('description')}
                />

                {/* Photo Attachment Simulation */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Photo Attachment (Optional)
                  </label>
                  {photoPreview ? (
                    <div className="relative w-40 h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img src={photoPreview} alt="Uploaded preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoPreview(null)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSimulatedPhotoUpload}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 dark:border-slate-700 dark:hover:border-indigo-600 text-xs text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span>Attach sample photo of defect</span>
                    </button>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/student/complaints')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    Submit Complaint
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* AI Real-time Triage Card (1 col) */}
        <div className="space-y-4">
          <Card className="border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 to-white dark:border-indigo-950 dark:from-indigo-950/20 dark:to-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Live AI Triage Engine
              </CardTitle>
              <CardDescription>
                Natural language analysis of your description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
                <span className="text-slate-500">Inferred Category:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {aiTriage.suggestedCategory}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
                <span className="text-slate-500">Inferred Urgency:</span>
                <Badge
                  variant={
                    aiTriage.priority === 'critical'
                      ? 'critical'
                      : aiTriage.priority === 'high'
                      ? 'warning'
                      : 'pending'
                  }
                  size="sm"
                >
                  {aiTriage.priority.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
                <span className="text-slate-500">Target Resolution SLA:</span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {aiTriage.slaHours} Hours
                </strong>
              </div>

              {selectedCategory !== aiTriage.suggestedCategory && (
                <button
                  type="button"
                  onClick={applyAiSuggestion}
                  className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply AI Classification ({aiTriage.suggestedCategory})</span>
                </button>
              )}

              <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-950 text-[11px] text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-indigo-700 dark:text-indigo-300 mb-0.5">
                  AI Rationale:
                </p>
                {aiTriage.alertReason}
              </div>

              <div className="text-[10px] text-slate-400 pt-1">
                Notice: The block warden can review and re-assign SLA if emergency escalation is required.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
