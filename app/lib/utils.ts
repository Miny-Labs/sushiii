import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function truncateAddress(address: string, start = 6, end = 4) {
  if (address.length <= start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'healthy':
    case 'ready':
    case 'active':
      return 'status-healthy'
    case 'degraded':
    case 'warning':
      return 'status-degraded'
    case 'unhealthy':
    case 'error':
    case 'failed':
      return 'status-unhealthy'
    default:
      return 'status-degraded'
  }
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}