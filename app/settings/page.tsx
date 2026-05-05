'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [confirmReset, setConfirmReset] = useState(false)

  function resetProgress() {
    localStorage.clear()
    router.push('/')
    window.location.reload()
  }

  return (
    <div className="bg-[#0f1115] text-gray-100 px-4 pt-6 pb-32">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-orange-400">
          Settings
        </h1>

        <button
  onClick={() => alert('Feedback coming soon')}
  className="
    w-full mt-4
    flex items-center justify-center gap-2
    py-3
    rounded-xl
    border border-orange-400/60
    text-orange-400
    font-semibold
    bg-orange-400/5
    hover:bg-orange-400/10
    hover:border-orange-400
    active:scale-[0.98]
    transition
  "
>
  💬 Send Feedback
</button>

      </div>

      {/* SHOP */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-2">Shop</h2>
        <p className="text-xs text-gray-400 mb-4">
          Simulation-only upgrades. No real money involved.
        </p>

        {/* MAX ENERGY */}
        <ShopRow title="Increase Max Energy">
          <ShopBigCard
            title="+25 Max Energy"
            subtitle="Permanent"
            icon="⚡"
            price="Free (Test)"
          />
          <ShopBigCard
            title="+50 Max Energy"
            subtitle="Permanent"
            icon="⚡"
            price="Coming soon"
            disabled
          />
          <ShopBigCard
            title="+100 Max Energy"
            subtitle="Permanent"
            icon="⚡"
            price="Coming soon"
            disabled
          />
        </ShopRow>

        {/* CASH */}
        <ShopRow title="Virtual Cash">
          <ShopBigCard
            title="€25,000 Cash"
            subtitle="Starter boost"
            icon="💰"
            price="Free (Test)"
          />
          <ShopBigCard
            title="€100,000 Cash"
            subtitle="+60% Bonus"
            icon="💰"
            price="Coming soon"
            disabled
          />
          <ShopBigCard
            title="€500,000 Cash"
            subtitle="+250% Bonus"
            icon="💰"
            price="Coming soon"
            disabled
          />
        </ShopRow>

        {/* XP */}
        <ShopRow title="Learning Boosts">
          <ShopBigCard
            title="+500 XP"
            subtitle="Instant"
            icon="📘"
            price="Free (Test)"
          />
          <ShopBigCard
            title="XP Boost"
            subtitle="Permanent"
            icon="📘"
            price="Coming soon"
            disabled
          />
        </ShopRow>

        {/* STARTER PACK */}
        <div className="mt-10">
          <div className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
            Starter Pack
          </div>

          <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-600/20 to-purple-900/30 border border-purple-500/40">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xl font-bold mb-1">
                  🎁 Starter Pack
                </div>
                <div className="text-sm text-gray-300">
                  +€25,000 Cash · +25 Max Energy
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Best for new players
                </div>
              </div>

              <button
                className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition"
              >
                Free (Test)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RESET */}
      <div className="bg-[#161b26] border border-red-500/30 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-red-400 mb-2">
          Danger Zone
        </h2>

        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full py-2 rounded-lg bg-red-600/20 text-red-400 font-semibold hover:bg-red-600/30 transition"
          >
            Reset Game Progress
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-gray-400">
              This will permanently delete all progress.
            </div>

            <button
              onClick={resetProgress}
              className="w-full py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition"
            >
              Yes, Reset Everything
            </button>

            <button
              onClick={() => setConfirmReset(false)}
              className="w-full py-2 rounded-lg bg-gray-700 text-gray-300 font-semibold hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- SHOP ROW ---------- */
function ShopRow({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-8">
      <div className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
        {title}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {children}
      </div>
    </div>
  )
}

/* ---------- SHOP CARD ---------- */
function ShopBigCard({
  title,
  subtitle,
  icon,
  price,
  disabled,
}: {
  title: string
  subtitle: string
  icon: string
  price: string
  disabled?: boolean
}) {
  return (
    <div
      className={`
        min-w-[220px]
        rounded-2xl p-5 border text-center transition
        ${disabled
          ? 'bg-[#141821] border-[#1f2430] opacity-60'
          : 'bg-[#161b26] border-[#1f2430] hover:border-green-500/50'}
      `}
    >
      <div className="text-4xl mb-3">{icon}</div>

      <div className="text-lg font-bold mb-1">
        {title}
      </div>

      <div className="text-xs text-gray-400 mb-4 uppercase tracking-wide">
        {subtitle}
      </div>

      <button
        disabled={disabled}
        className={`
          w-full py-2 rounded-xl text-sm font-semibold
          ${disabled
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-500 text-white'}
        `}
      >
        {price}
      </button>
    </div>
  )
}
