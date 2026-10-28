'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  numericValue?: number
  prefix?: string
  suffix?: string
  trend?: {
    value: number
    label: string
    isPositiveGood?: boolean
  }
  sparklineData?: number[]
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  className?: string
  description?: string
}

export function StatCard({
  title,
  value,
  numericValue,
  prefix = '',
  suffix = '',
  trend,
  sparklineData = [12, 18, 14, 22, 28, 24, 32],
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'from-primary/20 to-indigo-500/10',
  className,
  description,
}: StatCardProps) {
  const [displayCount, setDisplayCount] = useState<number>(0)

  // Animated count-up if numericValue is provided
  useEffect(() => {
    if (typeof numericValue !== 'number') return
    const duration = 900 // ms
    const steps = 30
    const stepTime = duration / steps
    let current = 0
    const stepValue = numericValue / steps

    const timer = setInterval(() => {
      current += stepValue
      if (current >= numericValue) {
        setDisplayCount(numericValue)
        clearInterval(timer)
      } else {
        setDisplayCount(Math.round(current))
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [numericValue])

  // Sparkline path generator
  const maxVal = Math.max(...sparklineData, 1)
  const minVal = Math.min(...sparklineData, 0)
  const range = maxVal - minVal || 1
  const width = 80
  const height = 28
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width
      const y = height - ((val - minVal) / range) * (height - 6) - 3
      return `${x},${y}`
    })
    .join(' ')

  const isPositive = trend ? trend.value > 0 : false
  const isNeutral = trend ? trend.value === 0 : true
  const isGood =
    trend && trend.isPositiveGood !== undefined
      ? trend.isPositiveGood
        ? isPositive
        : !isPositive
      : isPositive

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl glass-card p-5 card-hover-effect',
        className
      )}
    >
      {/* Background ambient gradient flare */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {prefix}
              {typeof numericValue === 'number'
                ? displayCount.toLocaleString('en-IN')
                : value}
              {suffix}
            </span>
          </div>
        </div>

        {/* Icon with gradient ring */}
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner transition-transform duration-300 group-hover:scale-110',
            iconBg
          )}
        >
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>

      {/* Bottom section: Trend chip + Sparkline */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/40">
        {trend ? (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                isNeutral
                  ? 'bg-muted text-muted-foreground'
                  : isGood
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              )}
            >
              {isNeutral ? (
                <Minus className="h-3 w-3" />
              ) : isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              {trend.label}
            </span>
          </div>
        ) : description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : (
          <div />
        )}

        {/* Mini SVG Sparkline */}
        <div className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <svg
            width={width}
            height={height}
            className="overflow-visible stroke-primary"
            fill="none"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  )
}
