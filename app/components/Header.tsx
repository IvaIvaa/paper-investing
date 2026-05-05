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
  } = usePlayer()

  const [date, setDate] = useState<Date>(START_DATE)

  useEffect(() => {
    const stored = localStorage.getItem(DATE_KEY)
    if (stored) setDate(new Date(stored))
    else localStorage.setItem(DATE_KEY, START_DATE.toISOString())
  }, [])

  function handleAdvance() {
    // ── Compute next date synchronously ──
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 7)
    localStorage.setItem(DATE_KEY, nextDate.toISOString())

    const prevMonth = date.getMonth()
    const nextMonth = nextDate.getMonth()

    // 1. Apply this week's prices (uses last preview's news effect)
    advanceWeek()

    // 2. Monthly events
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

    // 3. Preview NEXT week's news — runs after advanceWeek so weekStore is already incremented
    previewWeek()

    // 4. Update date display
    setDate(nextDate)
  }

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
        <button
          onClick={handleAdvance}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
        >
          Advance
        </button>
        <div className="text-sm text-gray-300">
          {date.toLocaleDateString('en-GB')}
        </div>
      </div>
    </header>
  )
}
