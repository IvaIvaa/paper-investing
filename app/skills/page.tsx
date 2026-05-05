'use client'

import { useState } from 'react'
import { usePlayer } from '@/lib/usePlayer'

type Bootcamp = {
  id: string
  title: string
  description: string
  levelReq: number
  energyCost: number
  xpReward: number
  spReward: number
}

type SkillInfo = {
  title: string
  description: string
  levels: string[]
}

const SKILL_INFO: Record<string, SkillInfo> = {
  marketKnowledge: {
    title: 'Market Analysis',
    description: 'Helps you understand what the market is doing.',
    levels: [
      'Better understanding of price movements',
      'Clearer trend recognition',
      'Faster reading of market situations',
      'Improved decision confidence',
      'Expert-level market awareness',
    ],
  },
  riskManagement: {
    title: 'Risk Management',
    description: 'Helps you avoid big mistakes and losses.',
    levels: [
      'Fewer costly errors',
      'Better control over losses',
      'More consistent results',
      'Stronger downside protection',
      'High resilience to bad outcomes',
    ],
  },
  efficiency: {
    title: 'Trade Execution',
    description: 'Helps you act at the right moment.',
    levels: [
      'Smoother trade execution',
      'Better timing',
      'Less wasted effort',
      'More effective actions',
      'Near-perfect execution flow',
    ],
  },
  longTerm: {
    title: 'Strategic Planning',
    description: 'Helps you think ahead and plan long-term.',
    levels: [
      'Better planning',
      'Smarter long-term choices',
      'Improved future outcomes',
      'More efficient growth',
      'Master-level strategic thinking',
    ],
  },
}

export default function SkillsPage() {
  const {
    energy,
    setEnergy,
    addXP,
    level,
    xp,
    skills,
    availableSkillPoints,
    upgradeSkill,
  } = usePlayer()

  const [openInfo, setOpenInfo] = useState<SkillInfo | null>(null)

  const bootcamps: Bootcamp[] = [
    {
      id: 'beginner',
      title: 'Beginner Bootcamp',
      description: 'Foundations of markets and trading.',
      levelReq: 1,
      energyCost: 25,
      xpReward: 150,
      spReward: 0.1,
    },
    {
      id: 'intermediate',
      title: 'Intermediate Training',
      description: 'Market analysis and strategy.',
      levelReq: 3,
      energyCost: 40,
      xpReward: 300,
      spReward: 0.25,
    },
    {
      id: 'advanced',
      title: 'Advanced Simulation',
      description: 'Professional-grade trading scenarios.',
      levelReq: 6,
      energyCost: 60,
      xpReward: 550,
      spReward: 0.5,
    },
  ]

  function train(b: Bootcamp) {
    if (level < b.levelReq) return
    if (energy < b.energyCost) return

    setEnergy(e => e - b.energyCost)
    addXP(b.xpReward)
  }

  // LEVEL PROGRESS
  const currentLevelXP = 100 * level * level
  const nextLevelXP = 100 * (level + 1) * (level + 1)

  const progress = Math.min(
    1,
    Math.max(0, (xp - currentLevelXP) / (nextLevelXP - currentLevelXP))
  )

  return (
    <div className="bg-[#0f1115] text-gray-100 px-4 pt-6 pb-32">
      <h1 className="text-2xl font-bold text-purple-400 mb-4">
        Skills & Learning
      </h1>

      {/* LEVEL */}
      <div className="bg-[#161b26] border border-[#1f2430] rounded-xl p-4 mb-4">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs text-gray-400">Level</div>
            <div className="text-xl font-semibold">{level}</div>
          </div>
          <div className="text-xs text-gray-400">
            {Math.max(0, xp - currentLevelXP)} / {nextLevelXP - currentLevelXP} XP
          </div>
        </div>

        <div className="mt-3 h-2 bg-[#1f2430] rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* SKILLS */}
      <div className="bg-[#161b26] border border-[#1f2430] rounded-xl p-4 mb-6">
        <div className="flex justify-between mb-4">
          <div className="text-sm font-semibold">Skill Points</div>
          <div className="text-sm text-gray-400">
            {availableSkillPoints} available
          </div>
        </div>

        <SkillRow
          label="Market Analysis"
          value={skills.marketKnowledge}
          onUpgrade={() => upgradeSkill('marketKnowledge')}
          onInfo={() => setOpenInfo(SKILL_INFO.marketKnowledge)}
          disabled={availableSkillPoints <= 0}
        />

        <SkillRow
          label="Risk Management"
          value={skills.riskManagement}
          onUpgrade={() => upgradeSkill('riskManagement')}
          onInfo={() => setOpenInfo(SKILL_INFO.riskManagement)}
          disabled={availableSkillPoints <= 0}
        />

        <SkillRow
          label="Trade Execution"
          value={skills.efficiency}
          onUpgrade={() => upgradeSkill('efficiency')}
          onInfo={() => setOpenInfo(SKILL_INFO.efficiency)}
          disabled={availableSkillPoints <= 0}
        />

        <SkillRow
          label="Strategic Planning"
          value={skills.longTerm}
          onUpgrade={() => upgradeSkill('longTerm')}
          onInfo={() => setOpenInfo(SKILL_INFO.longTerm)}
          disabled={availableSkillPoints <= 0}
        />
      </div>

      {/* BOOTCAMPS */}
      <div className="space-y-4">
        {bootcamps.map(b => {
          const locked = level < b.levelReq
          const noEnergy = energy < b.energyCost

          return (
            <div
              key={b.id}
              className={`rounded-xl border p-4 bg-[#161b26] border-[#1f2430]
                ${locked ? 'opacity-50' : ''}
              `}
            >
              <h3 className="text-lg font-semibold">{b.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{b.description}</p>

              <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium">
                <span className="px-2 py-1 rounded-md bg-[#1f2430]">
                  Level {b.levelReq}+
                </span>
                <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400">
                  -{b.energyCost} ⚡
                </span>
                <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400">
                  +{b.xpReward} XP
                </span>
                <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400">
                  +{b.spReward} SP
                </span>
              </div>

              <button
                onClick={() => train(b)}
                disabled={locked || noEnergy}
                className={`mt-3 px-4 py-2 rounded-lg text-sm font-semibold transition
                  ${locked || noEnergy
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'}
                `}
              >
                {locked ? 'Locked' : noEnergy ? 'No Energy' : 'Train'}
              </button>
            </div>
          )
        })}
      </div>

      {/* INFO POPUP */}
      {openInfo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161b26] border border-[#1f2430] rounded-xl p-5 max-w-sm w-full">
            <div className="text-lg font-semibold mb-1">
              {openInfo.title}
            </div>
            <div className="text-sm text-gray-400 mb-3">
              {openInfo.description}
            </div>

            <ul className="text-sm text-gray-300 space-y-1 mb-4">
              {openInfo.levels.map((l, i) => (
                <li key={i}>• Level {i + 1}: {l}</li>
              ))}
            </ul>

            <button
              onClick={() => setOpenInfo(null)}
              className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- SKILL ROW ---------- */
function SkillRow({
  label,
  value,
  onUpgrade,
  onInfo,
  disabled,
}: {
  label: string
  value: number
  onUpgrade: () => void
  onInfo: () => void
  disabled: boolean
}) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-[#1f2430] last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <button
          onClick={onInfo}
          className="w-5 h-5 rounded-full bg-[#1f2430] text-xs text-gray-300
                     hover:bg-purple-600 hover:text-white transition"
        >
          ?
        </button>
        <span className="text-xs text-gray-500 ml-2">
          Level {value}
        </span>
      </div>

      <button
        onClick={onUpgrade}
        disabled={disabled}
        className={`min-w-[80px] px-3 py-1.5 rounded-md text-sm font-semibold transition
          ${disabled
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-500 text-white'}
        `}
      >
        Upgrade
      </button>
    </div>
  )
}
