import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface Step {
  id: string
  title: string
  description?: string
  date?: string
}

export interface StepperProps {
  steps: Step[]
  currentStepIndex: number
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStepIndex,
  orientation = 'horizontal',
  className,
}) => {
  if (orientation === 'vertical') {
    return (
      <div className={cn('relative space-y-6 pl-2', className)}>
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex
          const isCurrent = idx === currentStepIndex
          const isPending = idx > currentStepIndex

          return (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Vertical connector line */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-3.5 top-7 -bottom-6 w-0.5',
                    isDone ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
                  )}
                />
              )}

              {/* Step indicator circle */}
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold z-10 transition-colors',
                  isDone
                    ? 'bg-indigo-600 text-white'
                    : isCurrent
                    ? 'border-2 border-indigo-600 bg-white text-indigo-600 dark:bg-slate-900 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800'
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>

              {/* Text */}
              <div className="pt-0.5 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h5
                    className={cn(
                      'text-xs font-semibold',
                      isCurrent
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : isDone
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                  >
                    {step.title}
                  </h5>
                  {step.date && (
                    <span className="text-[10px] text-slate-400">{step.date}</span>
                  )}
                </div>
                {step.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Horizontal Stepper
  return (
    <div className={cn('flex items-center justify-between w-full', className)}>
      {steps.map((step, idx) => {
        const isDone = idx < currentStepIndex
        const isCurrent = idx === currentStepIndex

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all',
                  isDone
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isCurrent
                    ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800'
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'mt-2 text-[11px] font-medium max-w-[80px] truncate',
                  isCurrent
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : isDone
                    ? 'text-slate-900 dark:text-slate-200'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {step.title}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2 -mt-5',
                  isDone ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
