import React from 'react'
import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
      <Card className="max-w-md p-8 flex flex-col items-center shadow-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 mb-4">
          <Compass className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
          404 Not Found
        </span>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Page Does Not Exist
        </h1>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The link you clicked may be broken or the page may have been relocated.
        </p>

        <div className="mt-6">
          <Link to="/">
            <Button size="sm" leftIcon={<Home className="w-3.5 h-3.5" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
