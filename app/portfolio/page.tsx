'use client'

import { useState } from 'react'
import { usePlayer } from '@/lib/usePlayer'

type PortfolioTab = 'stocks' | 'realestate'

/* ===============================
   STOCKS PORTFOLIO
================================ */
function StocksPortfolio() {
  const { holdings, stocks, sellStock, balance } = usePlayer()

  if (holdings.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-10 space-y-2">
        <p className="text-4xl">📈</p>
        <p className="font-semibold text-gray-300">No stocks owned yet</p>
        <p className="text-sm">Go to the Market tab to buy your first stock.</p>
      </div>
    )
  }

  const totalValue = holdings.reduce((sum, h) => {
    const stock = stocks.find(s => s.ticker === h.ticker)
    return sum + (stock ? stock.price * h.quantity : 0)
  }, 0)

  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0)
  const totalPL   = totalValue - totalCost
  const totalPct  = totalCost > 0 ? (totalPL / totalCost) * 100 : 0

  return (
    <>
      {/* Summary card */}
      <div className="bg-[#161b26] border border-[#1f2430] rounded-xl p-4 mb-6">
        <div className="text-sm text-gray-400">Stock Portfolio Value</div>
        <div className="text-2xl font-bold">€{totalValue.toLocaleString()}</div>
        <div className={`text-sm font-semibold mt-1 ${totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {totalPL >= 0 ? '▲' : '▼'} €{Math.abs(totalPL).toLocaleString()} ({totalPct.toFixed(2)}%)
        </div>
      </div>

      {/* Holdings list */}
      <div className="space-y-3">
        {holdings.map(h => {
          const stock    = stocks.find(s => s.ticker === h.ticker)
          const price    = stock?.price ?? 0
          const lastPrice = stock?.lastPrice ?? price
          const value    = price * h.quantity
          const avgPrice = h.totalCost / h.quantity

          // P/L vs cost basis (all-time since bought)
          const allTimePL  = value - h.totalCost
          const allTimePct = h.totalCost > 0 ? (allTimePL / h.totalCost) * 100 : 0

          // Weekly change (this week's price move)
          const weeklyPL  = lastPrice > 0 ? ((price - lastPrice) / lastPrice) * 100 : 0
          const weeklyAbs = (price - lastPrice) * h.quantity

          return (
            <div key={h.ticker} className="bg-[#161b26] border border-[#1f2430] rounded-xl p-4">
              {/* Top row */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg">{h.ticker}</div>
                  <div className="text-xs text-gray-400">{h.quantity} shares · avg €{avgPrice.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">€{value.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Current: €{price}</div>
                </div>
              </div>

              {/* Weekly + All-time change row */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#0f1115] rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-0.5">This week</div>
                  <div className={`text-sm font-semibold ${weeklyPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {weeklyPL >= 0 ? '+' : ''}{weeklyPL.toFixed(2)}%
                  </div>
                  <div className={`text-xs ${weeklyAbs >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {weeklyAbs >= 0 ? '+' : ''}€{weeklyAbs.toFixed(2)}
                  </div>
                </div>
                <div className="bg-[#0f1115] rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-0.5">All time</div>
                  <div className={`text-sm font-semibold ${allTimePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {allTimePL >= 0 ? '+' : ''}{allTimePct.toFixed(2)}%
                  </div>
                  <div className={`text-xs ${allTimePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {allTimePL >= 0 ? '+' : ''}€{allTimePL.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Cost basis */}
              <div className="text-xs text-gray-500 mb-3">
                Cost basis: €{h.totalCost.toFixed(2)}
              </div>

              {/* Sell button */}
              <button
                onClick={() => {
                  if (confirm(`Sell all ${h.quantity} shares of ${h.ticker} for €${value.toLocaleString()}?`)) {
                    sellStock(h.ticker, h.quantity)
                  }
                }}
                className="w-full py-2 rounded-lg bg-red-600/20 text-red-400 font-semibold text-sm hover:bg-red-600/30 transition"
              >
                Sell All ({h.quantity} shares · €{value.toLocaleString()})
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default function PortfolioPage() {
  const [tab, setTab] = useState<PortfolioTab>('realestate')

  return (
    <div className="bg-[#0f1115] text-gray-100 px-4 pt-6 pb-32">
      <h1 className="text-2xl font-bold text-emerald-400 mb-4">
        Portfolio
      </h1>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        <Tab
          label="Stocks"
          active={tab === 'stocks'}
          onClick={() => setTab('stocks')}
        />
        <Tab
          label="Real Estate"
          active={tab === 'realestate'}
          onClick={() => setTab('realestate')}
        />
      </div>

      {tab === 'stocks' && <StocksPortfolio />}
      {tab === 'realestate' && <RealEstatePortfolio />}
    </div>
  )
}

/* ===============================
   TAB
================================ */
function Tab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${
        active
          ? 'bg-emerald-600 text-white'
          : 'bg-[#161b26] text-gray-400'
      }`}
    >
      {label}
    </button>
  )
}

/* ===============================
   REAL ESTATE PORTFOLIO (CONNECTED)
================================ */
function RealEstatePortfolio() {
  const {
    ownedProperties,
    propertyPctChange,
    getRealEstatePctChange,
    sellProperty,
  } = usePlayer()

  const totalValue = ownedProperties.reduce(
    (s, p) => s + p.price,
    0
  )

  const totalRent = ownedProperties.reduce(
    (s, p) => s + p.rent,
    0
  )

  const portfolioPct = getRealEstatePctChange()

  if (ownedProperties.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        You do not own any properties yet.
      </div>
    )
  }

  return (
    <>
      <SummaryCard
        title="Property Value"
        value={totalValue}
        subtitle={`€${totalRent.toLocaleString()} / month rent`}
        pctChange={portfolioPct}
      />

      <div className="space-y-4">
        {ownedProperties.map(p => {
          const pct = propertyPctChange(p)

          return (
            <div
              key={p.id}
              className="bg-[#161b26] border border-[#1f2430] rounded-xl p-4"
            >
              <div className="font-semibold">
                {p.location}
              </div>

              <div className="flex justify-between text-sm mt-2">
                <span>Value</span>
                <span>€{p.price.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Rent</span>
                <span>€{p.rent.toLocaleString()} / mo</span>
              </div>

              {/* 🔥 PROPERTY % CHANGE */}
              <div
                className={`mt-2 text-sm font-semibold ${
                  pct >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {pct >= 0 ? '▲' : '▼'} {pct.toFixed(2)}%
              </div>

              {/* 🔥 SELL BUTTON */}
              <button
                onClick={() => {
                  if (
                    confirm(
                      'Selling a property returns only 90% of its value. Continue?'
                    )
                  ) {
                    sellProperty(p.id)
                  }
                }}
                className="mt-3 w-full py-2 rounded-lg bg-red-600/20 text-red-400 font-semibold"
              >
                Sell Property
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}



/* ===============================
   SUMMARY CARD
================================ */
function SummaryCard({
  title,
  value,
  subtitle,
  pctChange,
}: {
  title: string
  value: number
  subtitle?: string
  pctChange?: number
}) {

  return (
    <div className="bg-[#161b26] border border-[#1f2430] rounded-xl p-4 mb-6">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-2xl font-bold">
        €{value.toLocaleString()}
      </div>
      {pctChange !== undefined && (
  <div
    className={`text-sm font-semibold ${
      pctChange >= 0 ? 'text-green-400' : 'text-red-400'
    }`}
  >
    {pctChange >= 0 ? '▲' : '▼'} {pctChange.toFixed(2)}%
  </div>
)}


      {subtitle && (
        <div className="text-sm text-gray-400 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  )
}
