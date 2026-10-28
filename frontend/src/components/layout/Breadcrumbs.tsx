import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  const formatSegment = (str: string) => {
    return str
      .replace(/-/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
  }

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
      <Link
        to="/"
        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {formatSegment(segment)}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
