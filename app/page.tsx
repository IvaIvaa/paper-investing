'use client'

import { usePlayer } from '@/lib/usePlayer'


import {
  getStocks,
  tickMarket,
  searchStocks as mockSearchStocks,
} from '@/lib/market/mockMarket'

import { useEffect, useState } from 'react'
import PlayerSetup from './player-setup'
import type { Player } from './types/player'
import { useRouter, usePathname } from 'next/navigation'

const STARTING_BALANCE = 25_000n

type Trade = {
  id: number
  symbol: string
  quantity: number
  price: number
  type: 'BUY' | 'SELL'
}

const REFRESH_SECONDS = 30

function StatCard({
  title,
  value,
  sub,
  color,
}: {
  title: string
  value: string
  sub?: string
  color?: 'green' | 'red'
}) {
  return (
    <div className="bg-[#161b26] p-6 rounded-2xl shadow-md shadow-black/20 border border-[#1f2430]">
      <p className="text-sm font-medium text-gray-400">{title}</p>

      <p
        className={`mt-1 text-3xl font-semibold tabular-nums ${
          color === 'green'
            ? 'text-green-400'
            : color === 'red'
            ? 'text-red-400'
            : 'text-gray-100'
        }`}
      >
        {value}
      </p>

      {sub && <p className="mt-1 text-sm text-gray-500">{sub}</p>}
    </div>
  )
}

function formatMoney(value: bigint) {
  const abs = value < 0n ? -value : value

  if (abs >= 1_000_000_000_000n) {
    return `${Number(value / 1_000_000_000n) / 1000}B+`
  }

  if (abs >= 100_000_000n) {
    return `${Number(value / 1_000_000n) / 1000}M+`
  }

  return value
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function DashboardPage() {
  const { advanceMonth, advanceWeek } = usePlayer()

  const [sellError, setSellError] = useState<Record<number, string>>({})
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const [symbol, setSymbol] = useState('')
  const [buyQty, setBuyQty] = useState<number | ''>('')
  const [inputPrice, setInputPrice] = useState<number | null>(null)
  const [prevInputPrice, setPrevInputPrice] = useState<number | null>(null)
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({})
  const [symbolInput, setSymbolInput] = useState('')

  const [balance, setBalance] = useState<bigint>(STARTING_BALANCE)
  const [trades, setTrades] = useState<Trade[]>([])
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [sellQty, setSellQty] = useState<Record<number, number>>({})

  const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECONDS)
  const [loaded, setLoaded] = useState(false)
  const [week, setWeek] = useState(1)

  const [player, setPlayer] = useState<{
    name: string
    sex: 'male' | 'female' | 'other'
  } | null>(null)

  const router = useRouter()
  const pathname = usePathname()

  const [suggestions, setSuggestions] = useState<
    { symbol: string; name: string }[]
  >([])

  useEffect(() => {
    const storedPlayer = localStorage.getItem('playerProfile')
    if (storedPlayer) setPlayer(JSON.parse(storedPlayer))

    const privacy = localStorage.getItem('privacyAccepted')
    if (privacy === 'true') setPrivacyAccepted(true)

    setLoaded(true)
    setBalance(STARTING_BALANCE)
    setSecondsLeft(2)

    const marketInterval = setInterval(() => {
      tickMarket()
      const prices: Record<string, number> = {}
      getStocks().forEach(stock => {
        prices[stock.symbol] = stock.price
      })
      setPrevPrices(livePrices)
      setLivePrices(prices)
      setSecondsLeft(2)
    }, 2000)

    const countdownInterval = setInterval(() => {
      setSecondsLeft(s => (s > 1 ? s - 1 : 1))
    }, 1000)

    return () => {
      clearInterval(marketInterval)
      clearInterval(countdownInterval)
    }
  }, [])

  if (!loaded) return null

  if (!privacyAccepted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
        <div className="w-full max-w-md rounded-2xl bg-[#161b26] border border-[#1f2430] shadow-2xl p-6 text-gray-300 max-h-[85vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-100">
            Privacy Policy & Disclaimer
          </h2>

          <p className="mb-3 text-sm text-gray-400">
            Paper Gain is an educational investing simulation game.
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
          localStorage.setItem(
            'playerProfile',
            JSON.stringify(newPlayer)
          )
          setPlayer(newPlayer)
          setBalance(STARTING_BALANCE)
        }}
      />
    )
  }

  return (
     <div className="min-h-screen bg-[#0f1115] text-gray-100 px-4 pt-6 pb-24">

      {/* 📄 MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#3b82f6] mb-3">
            Market News
          </h2>

          <div className="bg-[#161b26] rounded-xl p-4 border border-[#1f2430]">
            <p className="font-semibold">Week {week} Overview</p>
            <p className="text-sm text-gray-400 mt-1">
              Markets are calm today.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
