'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/demo')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="font-sansation text-2xl font-bold">Sushiii</h1>
        <p className="text-muted-foreground">Redirecting to demo...</p>
      </div>
    </div>
  )
}