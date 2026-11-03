'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function BackendHealthBanner() {
  const { isError, data } = useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Backend offline')
      return res.json()
    },
    refetchInterval: 15000,
    retry: false,
  })

  const isOffline = isError || (data && data.status !== 'healthy')

  if (!isOffline) return null

  return (
    <div className="w-full bg-rose-600 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md shrink-0 z-50">
      <AlertCircle className="h-4 w-4 shrink-0 text-white animate-pulse" />
      <span>
        Backend is offline. Start it with:{' '}
        <code className="bg-rose-700/80 px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-mono">
          uvicorn backend.main:app --reload --port 8000
        </code>
      </span>
    </div>
  )
}

