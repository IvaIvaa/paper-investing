'use client'

import { useState } from 'react'
import { usePlayer } from '@/lib/usePlayer'

type PortfolioTab = 'stocks' | 'realestate'

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

      {tab === 'stocks' && <StocksPlaceholder />}
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
   STOCK PLACEHOLDER
================================ */
function StocksPlaceholder() {
  return (
    <div className="text-gray-400 text-sm">
      Stock portfolio coming soon.
    </div>
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
