'use client'

import { useEffect, useState } from 'react'
import { usePlayer } from '@/lib/usePlayer'

const DATE_KEY   = 'gameDate'
const START_DATE = new Date('2026-01-01')

export const JOB_EFFECTS: Record<string, { salary: number; energyCost: number; xpGain: number }> = {
  'job-1': { salary: 1800, energyCost: 10, xpGain: 20 },
  'job-2': { salary: 2400, energyCost: 12, xpGain: 25 },
  'job-3': { salary: 4200, energyCost: 18, xpGain: 35 },
  'job-4': { salary: 5200, energyCost: 20, xpGain: 40 },
  'job-5': { salary: 9800, energyCost: 28, xpGain: 60 },
}

export default function Header() {
  const {
    energy,
    setEnergy,
    balance,
    addMoney,
    addXP,
    currentJobId,
    advanceWeek,
    advanceMonth,
    previewWeek,
    pendingWeek,
  } = usePlayer()

  const [date, setDate] = useState<Date>(START_DATE)

  useEffect(() => {
    const stored = localStorage.getItem(DATE_KEY)
    if (stored) setDate(new Date(stored))
    else localStorage.setItem(DATE_KEY, START_DATE.toISOString())
  }, [])

  function handleAdvance() {
    if (!pendingWeek) {
      // ── STEP 1: generate news, don't move prices yet ──
      previewWeek()
    } else {
      // ── STEP 2: player has read news — apply prices & advance date ──
      setDate(prev => {
        const nextDate = new Date(prev)
        nextDate.setDate(nextDate.getDate() + 7)
        localStorage.setItem(DATE_KEY, nextDate.toISOString())

        const prevMonth = prev.getMonth()
        const nextMonth = nextDate.getMonth()

        // Apply stock price movement (uses pendingWeek data)
        advanceWeek()

        // Monthly events (salary, real estate, energy reset)
        if (prevMonth !== nextMonth) {
          setEnergy(100)
          if (currentJobId && JOB_EFFECTS[currentJobId]) {
            const job = JOB_EFFECTS[currentJobId]
            setEnergy(e => Math.max(0, e - job.energyCost))
            addMoney(job.salary)
            addXP(job.xpGain)
          }
          advanceMonth()
        }

        return nextDate
      })
    }
  }

  // Button appearance changes based on state
  const isPending  = !!pendingWeek
  const btnLabel   = isPending ? '✅ Apply Week' : 'Advance'
  const btnClass   = isPending
    ? 'bg-green-600 hover:bg-green-500'
    : 'bg-blue-600 hover:bg-blue-500'

  return (
    <header className="w-full px-6 py-4 flex justify-between items-start bg-[#141821] border-b border-[#1f2430]">
      {/* LEFT */}
      <div>
        <div className="text-2xl font-bold text-white">
          €{balance.toLocaleString()}
        </div>
        <div className="mt-1 text-sm text-gray-400">
          {energy} / 100 ⚡
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col items-end gap-2">

        {/* Pending hint */}
        {isPending && (
          <p className="text-xs text-yellow-400 font-medium">
            📰 News shown — trade now, then apply
          </p>
        )}

        <button
          onClick={handleAdvance}
          className={`px-5 py-2 rounded-lg text-white font-semibold transition ${btnClass}`}
        >
          {btnLabel}
        </button>

        <div className="text-sm text-gray-300">
          {date.toLocaleDateString('en-GB')}
        </div>
      </div>
    </header>
  )
}
