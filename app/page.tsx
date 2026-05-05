'use client'

import { usePlayer } from '@/lib/usePlayer'
import { useState } from 'react'
import PlayerSetup from './player-setup'
import type { Player } from './types/player'

export default function NewsPage() {
  const { news, stocks, balance, week } = usePlayer() as any
  const [privacyAccepted, setPrivacyAccepted] = useState(
    typeof window !== 'undefined' && localStorage.getItem('privacyAccepted') === 'true'
  )
  const [player, setPlayer] = useState<Player | null>(() => {
    if (typeof window === 'undefined') return null
    const s = localStorage.getItem('playerProfile')
    return s ? JSON.parse(s) : null
  })

  if (!privacyAccepted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
        <div className="w-full max-w-md rounded-2xl bg-[#161b26] border border-[#1f2430] shadow-2xl p-6 text-gray-300 max-h-[85vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-100">
            Privacy Policy & Disclaimer
          </h2>
          <p className="mb-3 text-sm text-gray-400">
            Paper Gain is an educational investing simulation game. All prices and events are fictional. No real money is involved.
          </p>
          <button
            onClick={() => {
              localStorage.setItem('privacyAccepted', 'true')
              setPrivacyAccepted(true)
            }}
            className="w-full rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 py-3 text-white font-semibold"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <PlayerSetup
        onComplete={(newPlayer: Player) => {
          localStorage.setItem('playerProfile', JSON.stringify(newPlayer))
          setPlayer(newPlayer)
        }}
      />
    )
  }

  const sentimentConfig = {
    positive: {
      border:  'border-green-500/40',
      bg:      'bg-green-500/5',
      badge:   'bg-green-500/20 text-green-400',
      label:   '📈 Positive',
      ticker:  'text-green-400',
    },
    negative: {
      border:  'border-red-500/40',
      bg:      'bg-red-500/5',
      badge:   'bg-red-500/20 text-red-400',
      label:   '📉 Negative',
      ticker:  'text-red-400',
    },
    neutral: {
      border:  'border-[#1f2430]',
      bg:      '',
      badge:   'bg-gray-700/40 text-gray-400',
      label:   '➖ Neutral',
      ticker:  'text-gray-400',
    },
  }

  return (
    <div className="bg-[#0f1115] text-gray-100 px-4 pt-6 pb-40 min-h-screen">
      <h1 className="text-2xl font-bold text-blue-400 mb-1">Market News</h1>

      {news.length === 0 ? (
        <div className="mt-10 text-center text-gray-500 space-y-2">
          <p className="text-4xl">📰</p>
          <p className="font-semibold text-gray-300">No news yet</p>
          <p className="text-sm">Press <span className="text-blue-400 font-semibold">Advance</span> to generate this week's headlines.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-6">
        <p className="text-sm text-gray-500">Week {news[0]?.week} preview</p>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
          ⏳ Prices apply next Advance
        </span>
      </div>
          <div className="space-y-4">
            {news.map((item: any, i: number) => {
              const cfg = sentimentConfig[item.sentiment as keyof typeof sentimentConfig]
              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-4 space-y-2 ${cfg.border} ${cfg.bg} bg-[#161b26]`}
                >
                  {/* Badge + ticker */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    {item.ticker !== 'MARKET' && (
                      <span className={`text-xs font-bold ${cfg.ticker}`}>
                        {item.ticker}
                      </span>
                    )}
                  </div>

                  {/* Headline */}
                  <p className="font-semibold text-gray-100 leading-snug">
                    {item.headline}
                  </p>

                  {/* Body */}
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {item.body}
                  </p>

                  {/* Price impact hint */}
                  {item.ticker !== 'MARKET' && (
                    <p className={`text-xs font-medium ${cfg.ticker}`}>
                      {item.sentiment === 'positive'
                        ? `▲ ${item.ticker} received an extra +5% boost this week`
                        : `▼ ${item.ticker} took an extra -5% hit this week`}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
