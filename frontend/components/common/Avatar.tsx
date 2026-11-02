'use client'

import React, { useState } from 'react'

interface AvatarProps {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  src?: string | null
  alt?: string
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function Avatar({
  name,
  size = 'md',
  className = '',
  src,
  alt,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)

  const cleanName = (name || 'User').trim()
  const dicebearUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    cleanName
  )}&backgroundColor=0284c7,4f46e5,0d9488,d97706,e11d48&textColor=ffffff`

  const avatarSrc = !imageError && src && !src.includes('unsplash.com') ? src : dicebearUrl

  return (
    <img
      src={avatarSrc}
      alt={alt || cleanName}
      onError={() => setImageError(true)}
      className={`rounded-full object-cover ring-1 ring-border/40 shrink-0 ${sizeClasses[size]} ${className}`}
    />
  )
}
