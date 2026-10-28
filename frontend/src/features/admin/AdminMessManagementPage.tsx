import React, { useEffect, useState } from 'react'
import { Utensils, Star, Users, Phone, Building, CheckCircle2, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import type { MessFeedback } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SentimentMeter } from '@/components/charts/SentimentMeter'

export const AdminMessManagementPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<MessFeedback[]>([])
  const [activeTab, setActiveTab] = useState<'menu' | 'caterer' | 'reviews'>('menu')

  useEffect(() => {
    api.getMessFeedback().then(setFeedbacks).catch(console.error)
  }, [])

  const weeklySchedule = [
    { day: 'Monday', breakfast: 'Idli Vada & Sambar', lunch: 'Rajma Chawal & Mix Veg', dinner: 'Aloo Gobi & Dal Tadka' },
    { day: 'Tuesday', breakfast: 'Poha & Jalebi', lunch: 'Kadhi Pakora & Jeera Rice', dinner: 'Paneer Butter Masala & Phulkas' },
    { day: 'Wednesday', breakfast: 'Upma & Coconut Chutney', lunch: 'Chole Bhature & Boondi Raita', dinner: 'Dal Makhani & Gulab Jamun' },
    { day: 'Thursday', breakfast: 'Aloo Paratha & Curd', lunch: 'Veg Biryani & Mirchi Ka Salan', dinner: 'Matar Paneer & Roti' },
    { day: 'Friday', breakfast: 'Masala Dosa & Sambar', lunch: 'Dal Fry & Bhindi Do Pyaza', dinner: 'Veg Pulao & Kheer' },
    { day: 'Saturday', breakfast: 'Poori Bhaji', lunch: 'Kashmiri Dum Aloo & Rice', dinner: 'Pav Bhaji & Pulao' },
    { day: 'Sunday', breakfast: 'Chole Kulche', lunch: 'Special South Indian Feast', dinner: 'Paneer Tikka & Naan' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Catering Operations & Mess Management
          </h1>
          <p className="text-xs text-slate-500">
            Menu rotas, caterer contracts, food safety audits, and student meal satisfaction
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['menu', 'caterer', 'reviews'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === t
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'menu' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Rota & Meal Timings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Breakfast (7:30 - 9:30 AM)</th>
                    <th className="px-4 py-3">Lunch (12:30 - 2:30 PM)</th>
                    <th className="px-4 py-3">Dinner (7:45 - 9:45 PM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                  {weeklySchedule.map((row) => (
                    <tr key={row.day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{row.day}</td>
                      <td className="px-4 py-3">{row.breakfast}</td>
                      <td className="px-4 py-3">{row.lunch}</td>
                      <td className="px-4 py-3">{row.dinner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'caterer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Annapurna Hospitality Services Pvt Ltd</h3>
                <p className="text-xs text-slate-400">Contract Ref: CAT-2025-2027 • ISO 22000 Certified</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p><strong>Lead Operations Manager:</strong> Shri Anand Deshpande</p>
              <p><strong>Kitchen Phone:</strong> +91 98221 44556</p>
              <p><strong>Mess Capacity:</strong> 450 Diners Simultaneously</p>
              <p><strong>Contract Period:</strong> 1 Aug 2025 – 31 Jul 2027</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Latest Food Safety Hygiene Audit Passed (Score: 94/100)</span>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'reviews' && (
        <Card className="p-6">
          <CardHeader className="pb-3 px-0">
            <CardTitle className="text-base">Student Sentiment Health</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <SentimentMeter />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
