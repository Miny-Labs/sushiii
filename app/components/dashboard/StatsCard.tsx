'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon: ReactNode
  description?: string
}

export default function StatsCard({ title, value, change, icon, description }: StatsCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-white">{value}</p>
              {change !== undefined && (
                <div className={`flex items-center text-sm ${
                  isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
                  {isNegative && <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(change)}%
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
          <div className="p-3 glass rounded-lg">
            {icon}
          </div>
        </div>
      </CardContent>
      
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5,
          ease: 'easeInOut'
        }}
      />
    </Card>
  )
}