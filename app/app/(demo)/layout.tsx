import type { Metadata } from 'next'
import DemoHeader from '@/components/layout/DemoHeader'
import DemoFooter from '@/components/layout/DemoFooter'

export const metadata: Metadata = {
  title: 'Sushiii - Privacy Compliance Platform Demo',
  description: 'Blockchain-backed privacy compliance platform demonstration',
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground font-semi-expanded flex flex-col">
      <DemoHeader />
      <main className="flex-1">
        {children}
      </main>
      <DemoFooter />
    </div>
  )
}