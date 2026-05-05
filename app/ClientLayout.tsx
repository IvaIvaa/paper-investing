'use client'

import { usePathname, useRouter } from 'next/navigation'
import Header from './components/Header'
import { Analytics } from '@vercel/analytics/react'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <>
      <Header />

      <main className="flex-1 pb-24 bg-[#0f1115] relative z-0">
        {children}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#141821] border-t border-[#1f2430] z-50 pointer-events-none">
        <div className="grid grid-cols-5 h-20 text-xs text-gray-400">
          <FooterButton
            active={pathname === '/'}
            icon="📰"
            label="News"
            onClick={() => router.push('/')}
          />

          <FooterButton
            active={pathname === '/skills'}
            icon="🧠"
            label="Skills"
            onClick={() => router.push('/skills')}
          />

          <FooterButton
            active={pathname === '/market'}
            icon="📈"
            label="Market"
            onClick={() => router.push('/market')}
          />

          <button
            onClick={() => router.push('/portfolio')}
            className={`pointer-events-auto w-full h-full flex flex-col items-center justify-center gap-1 transition-colors
              ${
                pathname === '/portfolio'
                  ? 'text-[#10b981] font-semibold'
                  : 'hover:text-gray-200'
              }
            `}
          >
            <span className="text-xl">📊</span>
            <span>Portfolio</span>
          </button>

          <FooterButton
            active={pathname === '/settings'}
            icon="⚙️"
            label="Settings"
            onClick={() => router.push('/settings')}
          />
        </div>
      </footer>

      <Analytics />
    </>
  )
}

function FooterButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        pointer-events-auto
        w-full h-full
        flex flex-col items-center justify-center gap-1
        transition-colors
        ${active ? 'font-semibold' : 'hover:text-gray-200'}
      `}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
