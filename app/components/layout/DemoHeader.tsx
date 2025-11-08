'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Admin', href: '/admin' },
  { name: 'Auditor', href: '/auditor' },
  { name: 'Health', href: '/health' },
]

export default function DemoHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b border-black">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-sansation font-bold text-2xl tracking-tight">
            Sushiii
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'font-zalando-expanded font-medium text-sm tracking-wide transition-all duration-200',
                    isActive
                      ? 'text-black border-b border-black pb-1'
                      : 'text-black/60 hover:text-black'
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}