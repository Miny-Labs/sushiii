'use client'

import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'jurisdiction' | 'verified' | 'unverified'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'border border-black px-2 py-1 text-xs font-zalando-expanded font-medium',
    jurisdiction: 'border border-black px-2 py-1 text-xs font-zalando-expanded font-bold tracking-wider',
    verified: 'border border-black px-2 py-1 text-xs font-zalando-expanded font-medium bg-black text-white',
    unverified: 'border border-black px-2 py-1 text-xs font-zalando-expanded font-medium bg-white text-black',
  }

  return (
    <span className={cn(variants[variant], className)}>
      {children}
    </span>
  )
}