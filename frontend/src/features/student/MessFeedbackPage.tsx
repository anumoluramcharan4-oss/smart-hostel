import React, { useEffect, useState } from 'react'
import { Star, Utensils, Smile, Meh, Frown, CheckCircle2, Clock } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { useToast } from '@/app/ToastContext'
import { api } from '@/lib/api'
import type { MessFeedback, MealType, MessCategory } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { formatDate } from '@/lib/utils/formatters'

export const MessFeedbackPage: React.FC = () => {
  const { user } = useAuth()
  const { success } = useToast()
  const [feedbacks, setFeedbacks] = useState<MessFeedback[]>([])
  const [mealType, setMealType] = useState<MealType>('dinner')
  const [rating, setRating] = useState<number>(4)
  const [category, setCategory] = useState<MessCategory>('taste')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadFeedbacks = async () => {
    try {
      const list = await api.getMessFeedback()
      setFeedbacks(list)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setIsSubmitting(true)
    try {
      const created = await api.createMessFeedback({
        date: new Date().toISOString().slice(0, 10),
        mealType,
        rating,
        category,
        comment,
      })
      setFeedbacks((prev) => [created, ...prev])
      setComment('')
      success('Thank you! Your mess review has been recorded.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const todayMenu = [
    { meal: 'Breakfast (7:30 - 9:30 AM)', items: 'Poha with Sev, Sambar, Coconut Chutney, Boiled Eggs / Bananas, Tea & Coffee' },
    { meal: 'Lunch (12:30 - 2:30 PM)', items: 'Paneer Butter Masala, Yellow Dal Tadka, Phulkas, Steamed Rice, Cucumber Salad, Curd' },
    { meal: 'Evening Snacks (4:30 - 5:45 PM)', items: 'Crispy Veg Samosas with Mint & Tamarind Chutney, Masala Chai' },
    { meal: 'Dinner (7:45 - 9:45 PM)', items: 'Dal Makhani, Mix Veg Kolhapuri, Jeera Rice, Tawa Roti, Gulab Jamun' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mess Menu & Daily Feedback
        </h1>
        <p className="text-xs text-slate-500">
          Review daily menu timings and submit meal ratings to maintain food quality
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's Menu Schedule */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-600" />
                Today's Dining Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayMenu.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{m.meal}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {m.items}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Feedback Form & Recent Reviews (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rate Meal Form */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Submit Meal Review</CardTitle>
              <p className="text-xs text-slate-500">Your feedback is analyzed by our AI sentiment model</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Select Meal"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    options={[
                      { value: 'breakfast', label: 'Breakfast' },
                      { value: 'lunch', label: 'Lunch' },
                      { value: 'snacks', label: 'Evening Snacks' },
                      { value: 'dinner', label: 'Dinner' },
                    ]}
                  />

                  <Select
                    label="Feedback Focus"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MessCategory)}
                    options={[
                      { value: 'taste', label: 'Taste & Flavors' },
                      { value: 'food_quality', label: 'Food Quality & Freshness' },
                      { value: 'hygiene', label: 'Mess Hygiene & Cleanliness' },
                      { value: 'service', label: 'Service & Promptness' },
                      { value: 'variety', label: 'Menu Variety' },
                    ]}
                  />
                </div>

                {/* Star Rating Picker */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Your Rating: {rating} / 5 Stars
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 ml-2">
                      {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Poor'}
                    </span>
                  </div>
                </div>

                <Textarea
                  label="Comments & Observations"
                  rows={3}
                  placeholder="Share details about preparation, warmth, spice level, or shortages..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />

                <div className="flex justify-end">
                  <Button type="submit" isLoading={isSubmitting} disabled={!comment.trim()}>
                    Submit Meal Rating
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recent Feedback Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Campus Mess Feedbacks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {feedbacks.slice(0, 4).map((fb) => (
                <div
                  key={fb.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-1.5"
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
                      AI Sentiment: <strong className="capitalize">{fb.sentiment}</strong>
                    </span>
                    <span>{formatDate(fb.date)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
