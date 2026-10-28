import React, { useEffect, useState } from 'react'
import { Utensils, Star, AlertTriangle, Smile, Meh, Frown, CheckCircle2, TrendingUp } from 'lucide-react'
import { api } from '@/lib/api'
import type { MessFeedback } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SentimentMeter } from '@/components/charts/SentimentMeter'
import { formatDate } from '@/lib/utils/formatters'

export const WardenMessFeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<MessFeedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMessFeedback().then((res) => {
      setFeedbacks(res)
      setLoading(false)
    }).catch(console.error)
  }, [])

  const positiveCount = feedbacks.filter((f) => f.sentiment === 'positive').length
  const neutralCount = feedbacks.filter((f) => f.sentiment === 'neutral').length
  const negativeCount = feedbacks.filter((f) => f.sentiment === 'negative').length
  const total = feedbacks.length || 1

  const posPct = Math.round((positiveCount / total) * 100)
  const neuPct = Math.round((neutralCount / total) * 100)
  const negPct = 100 - posPct - neuPct

  const avgRating = feedbacks.length
    ? Number((feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1))
    : 4.0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Dining Hall & Mess Feedback Oversight
        </h1>
        <p className="text-xs text-slate-500">
          Sentiment intelligence, weekly food satisfaction benchmarks, and student concerns
        </p>
      </div>

      {/* Sentiment Overview & AI Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Utensils className="w-4 h-4 text-indigo-600" />
              Overall Mess Sentiment Health (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentMeter
              positive={posPct}
              neutral={neuPct}
              negative={negPct}
              averageRating={avgRating}
              totalReviews={feedbacks.length}
            />
          </CardContent>
        </Card>

        {/* AI Top Issues Card */}
        <Card className="border-amber-200/80 bg-amber-50/20 dark:border-amber-900/50 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              AI Identified Action Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40">
              <p className="font-bold text-slate-900 dark:text-slate-100">Tuesday Dinner Salt Levels</p>
              <p className="text-slate-500 text-[11px] mt-0.5">3 students reported high sodium and coloring in Paneer gravy.</p>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40">
              <p className="font-bold text-slate-900 dark:text-slate-100">Evening Snack Counter Refills</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Samosas ran out by 5:20 PM; request caterer to maintain second batch.</p>
            </div>

            <div className="pt-1 text-[10px] text-slate-400">
              Auto-forwarded to Caterer Operations Manager.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedbacks Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Student Feedback Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {fb.studentName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <Badge variant="pending" size="sm" className="capitalize">
                      {fb.mealType}
                    </Badge>
                    <Badge variant="outline" size="sm" className="capitalize">
                      {fb.category.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < fb.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  "{fb.comment}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    {fb.sentiment === 'positive' ? (
                      <Smile className="w-3 h-3 text-emerald-500" />
                    ) : fb.sentiment === 'negative' ? (
                      <Frown className="w-3 h-3 text-rose-500" />
                    ) : (
                      <Meh className="w-3 h-3 text-amber-500" />
                    )}
                    Sentiment: <strong className="capitalize">{fb.sentiment}</strong>
                  </span>
                  <span>{formatDate(fb.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
