'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
  variant?: 'default' | 'ghost'
  size?: 'default' | 'sm'
}

export default function CopyButton({ 
  text, 
  label = 'Copy', 
  className,
  variant = 'ghost',
  size = 'sm'
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        'h-6 px-2 font-mono text-xs border border-black hover:bg-black hover:text-white transition-colors',
        className
      )}
      aria-label={`${label}: ${text}`}
    >
      {copied ? (
        <Check className="w-3 h-3" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </Button>
  )
}