import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card'
import { cn } from '@/lib/utils/cn'

export interface ChartCardProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  badge,
  action,
  children,
  className,
  contentClassName,
}) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-start justify-between pb-3 space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {title}
            </CardTitle>
            {badge}
          </div>
          {subtitle && (
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </CardDescription>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>

      <CardContent className={cn('pt-2', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
