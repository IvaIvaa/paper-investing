'use client'

import { useState, useEffect } from 'react'
import { usePlayer } from '@/lib/usePlayer'
import Image from 'next/image'

type MarketTabType = 'stocks' | 'realestate' | 'jobs'
type TimeRange = '1W' | '1M' | '3M' | '1Y' | 'ALL'

type Stock = {
  ticker: string
  name: string
  sector: string
  price: number
  change: number
  avgPrice: number
  volatility: 'Low' | 'Medium' | 'High'
  marketCap: string
  high52w: number
  low52w: number
  dividendYield?: number
  description: string
}

type Property = {
  id: string
  location: string
  price: number
  rent: number
  yield: number
  risk: 'Low' | 'Medium' | 'High'
  description: string
  image: string
}

type Job = {
  id: string
  title: string
  company: string
  salary: number
  level: 'Entry' | 'Professional' | 'Executive'
  stability: 'Low' | 'Medium' | 'High'
  description: string

  // NEW
  requiredLevel: number
  energyCost: number
}


export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<MarketTabType>('stocks')
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
const [energy, setEnergy] = useState(100)

  return (
    <div className="bg-[#0f1115] text-gray-100 px-4 pt-6 pb-40">
      <h1 className="text-2xl font-bold text-green-400 mb-4">Market</h1>

      <div className="flex gap-2 mb-6">
        <Tab label="Stock Market" active={activeTab === 'stocks'} onClick={() => setActiveTab('stocks')} />
        <Tab label="Real Estate" active={activeTab === 'realestate'} onClick={() => setActiveTab('realestate')} />
        <Tab label="Jobs" active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} />
      </div>

      {activeTab === 'stocks' && <StockMarket onSelect={setSelectedStock} />}
      {activeTab === 'realestate' && <RealEstateMarket />}
      {activeTab === 'jobs' && <JobsMarket />}


      {selectedStock && (
        <StockModal stock={selectedStock} onClose={() => setSelectedStock(null)} />
      )}
    </div>
  )
}

/* ---------- TAB ---------- */
function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${
        active ? 'bg-green-600 text-white' : 'bg-[#161b26] text-gray-400 hover:bg-[#1f2430]'
      }`}
    >
      {label}
    </button>
  )
}

/* ===============================
   STOCK MARKET (UNCHANGED)
================================ */
function StockMarket({
  
  onSelect,
}: {
  onSelect: (s: Stock) => void
}) {
  const { stocks } = usePlayer()
  const mappedStocks: Stock[] = stocks.map(s => ({
  ticker: s.ticker,
  name: s.ticker,
  sector: 'Finance', // later you can store sector per stock
  price: s.price,
  change: s.lastPrice
    ? ((s.price - s.lastPrice) / s.lastPrice) * 100
    : 0,
  avgPrice: s.price,
  volatility: 'Medium',
  marketCap: '—',
  high52w: s.price,
  low52w: s.price,
  description: 'Market traded stock',
}))



  const sectors = Array.from(new Set(mappedStocks.map(s => s.sector)))

  return (
    <div className="space-y-8">
      {sectors.map(sector => (
        <div key={sector}>
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
            {sector}
          </h3>

          <div className="space-y-3">
            {mappedStocks
  .filter(s => s.sector === sector)
  .map(stock => (
    <StockCard
      key={stock.ticker}
      stock={stock}
      onClick={onSelect}
    />
))}

          </div>
        </div>
      ))}
    </div>
  )
}


function StockCard({ stock, onClick }: { stock: Stock; onClick: (s: Stock) => void }) {
  return (
    <button onClick={() => onClick(stock)} className="w-full text-left bg-[#161b26] border border-[#1f2430] rounded-xl p-4">
      <div className="flex justify-between">
        <div>
          <div className="text-lg font-semibold">{stock.ticker}</div>
          <div className="text-xs text-gray-400">{stock.name}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold">€{stock.price}</div>
          <div className={stock.change >= 0 ? 'text-green-400' : 'text-red-400'}>
            {stock.change >= 0 ? '+' : ''}
            {stock.change.toFixed(2)}%
          </div>
        </div>
      </div>
    </button>
  )
}

/* ===============================
   REAL ESTATE MARKET (FIXED)
================================ */

/* ===============================
   REAL ESTATE MARKET
================================ */
export function RealEstateMarket() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  const properties: Property[] = [
    {
      id: 're-1',
      location: 'Brno, CZ',
      price: 120000,
      rent: 650,
      yield: 6.5,
      risk: 'Low',
      description: 'Small apartment with stable demand.',
      image: '/real-estate/brno.png',
    },
    {
      id: 're-2',
      location: 'Ostrava, CZ',
      price: 145000,
      rent: 720,
      yield: 6.0,
      risk: 'Low',
      description: 'Residential flat near city center.',
      image: '/real-estate/ostrava.png',
    },
    {
      id: 're-3',
      location: 'Lisbon, PT',
      price: 210000,
      rent: 950,
      yield: 5.4,
      risk: 'Medium',
      description: 'Tourism-driven rental property.',
      image: '/real-estate/lisbon.png',
    },
    {
      id: 're-4',
      location: 'Prague, CZ',
      price: 245000,
      rent: 1050,
      yield: 5.1,
      risk: 'Low',
      description: 'Modern apartment in city center.',
      image: '/real-estate/prague.png',
    },
    {
      id: 're-5',
      location: 'Vienna, AT',
      price: 275000,
      rent: 1150,
      yield: 5.0,
      risk: 'Low',
      description: 'Historic district flat.',
      image: '/real-estate/vienna.png',
    },
    {
      id: 're-6',
      location: 'Berlin, DE',
      price: 320000,
      rent: 1350,
      yield: 5.0,
      risk: 'Medium',
      description: 'Residential flat in growing district.',
      image: '/real-estate/berlin.png',
    },
    {
      id: 're-7',
      location: 'Paris, FR',
      price: 410000,
      rent: 1650,
      yield: 4.8,
      risk: 'Low',
      description: 'Prime location long-term rental.',
      image: '/real-estate/paris.png',
    },
    {
      id: 're-8',
      location: 'London, UK',
      price: 520000,
      rent: 1950,
      yield: 4.5,
      risk: 'Medium',
      description: 'High-demand international rental.',
      image: '/real-estate/london.png',
    },
    {
      id: 're-9',
      location: 'Dubai, UAE',
      price: 780000,
      rent: 2850,
      yield: 4.4,
      risk: 'Medium',
      description: 'Luxury apartment in global business hub.',
      image: '/real-estate/dubai.png',
    },
    {
      id: 're-10',
      location: 'Tbilisi, Georgia',
      price: 1250000,
      rent: 4100,
      yield: 3.9,
      risk: 'High',
      description: 'Ultra-premium landmark property.',
      image: '/real-estate/tbilisi.png',
    },
  ]

  const sortedProperties = [...properties].sort(
    (a, b) => a.price - b.price
  )

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedProperties.map(property => (
          <PropertyCard
            key={property.id}
            property={property}
            onClick={() => setSelectedProperty(property)}
          />
        ))}
      </div>

      {selectedProperty && (
        <PropertyModal
        
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </>
  )
}

function PropertyCard({
  property,
  onClick,
}: {
  property: Property
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="text-left">
      <div className="bg-[#161b26] border border-[#1f2430] rounded-2xl p-4 space-y-3 hover:border-green-500/40 transition">
        <div className="relative h-28 rounded-xl overflow-hidden border border-[#1f2430]">
          <Image
            src={property.image}
            alt={property.location}
            fill
            className="object-cover"
          />
        </div>

        <div className="font-semibold">
          {property.location}
        </div>

        <div className="text-xl font-bold">
          €{property.price.toLocaleString()}
        </div>

        <div className="text-sm text-gray-400 flex justify-between">
          <span>Rent €{property.rent}/mo</span>
          <span>{property.yield}%</span>
        </div>
      </div>
    </button>
  )
}

function PropertyModal({
  
  property,
  onClose,
}: {
  property: Property
  onClose: () => void
}) {
   const { buyProperty, sellProperty, balance, ownedProperties } = usePlayer()  
   const isOwned = ownedProperties.some(
  p => p.id === property.id
)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="bg-[#0f1115] border border-[#1f2430] rounded-2xl w-full max-w-md p-5">
        <div className="flex justify-between mb-3">
          <div>
            <div className="text-xl font-bold">
              {property.location}
            </div>
            <div className="text-sm text-gray-400">
              {property.risk} Risk · {property.yield}% Yield
            </div>
          </div>
          <button onClick={onClose} className="text-xl">
            ✕
          </button>
        </div>

        <div className="relative h-40 rounded-xl overflow-hidden border border-[#1f2430] mb-4">
          <Image
            src={property.image}
            alt={property.location}
            fill
            className="object-cover"
          />
        </div>

        <div className="text-2xl font-bold mb-2">
          €{property.price.toLocaleString()}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <Stat label="Monthly Rent" value={`€${property.rent}`} />
          <Stat label="Yield" value={`${property.yield}%`} />
          <Stat label="Risk" value={property.risk} />
          <Stat label="Type" value="Residential" />
        </div>

        <p className="text-sm text-gray-400 mb-4">
          {property.description}
        </p>

        <div className="bg-[#161b26] border border-[#1f2430] rounded-xl p-3 text-sm text-gray-400 mb-4">
          🏠 Generates passive income every month<br />
          🛠 Maintenance costs may apply
        </div>

        <div className="flex gap-3">
          <button
  onClick={() => {
      const success = buyProperty(
  property.id,
  property.location,
  property.price,
  property.rent
)



    if (success) {
      onClose()
    } else {
      alert('Not enough money or already owned')
    }
  }}
  disabled={isOwned || balance < property.price}
  className={`flex-1 py-3 rounded-xl font-semibold ${
    isOwned
      ? 'bg-green-700/30 text-green-400 cursor-default'
      : balance < property.price
      ? 'bg-gray-600/20 text-gray-400 cursor-not-allowed'
      : 'bg-green-600/20 text-green-400'
  }`}
>
  {isOwned ? 'Owned ✓' : 'Buy Property'}
</button>



          <button
  disabled={!isOwned}
  onClick={() => {
  const sellPrice = Math.floor(property.price * 0.9)

  const confirmed = window.confirm(
    `⚠️ Selling this property will give you €${sellPrice.toLocaleString()} (10% loss).\n\nDo you want to continue?`
  )

  if (!confirmed) return

  const success = sellProperty(property.id)
  if (success) {
    onClose()
  }
}}

  className={`flex-1 py-3 rounded-xl font-semibold ${
    isOwned
      ? 'bg-red-600/20 text-red-400'
      : 'bg-red-600/10 text-red-400/40 cursor-not-allowed'
  }`}
>
  {isOwned ? 'Sell Property' : 'Sell (not owned)'}
</button>


        </div>
      </div>
    </div>
  )
}

/* =============================== */
function Placeholder() {
  return <div className="text-gray-400">Coming soon</div>
}

/* ===============================
   PRICE CHART (SVG)
================================ */
function PriceChart({ history, range }: { history: number[]; range: TimeRange }) {
  const sliceMap: Record<TimeRange, number> = { '1W': 2, '1M': 4, '3M': 12, '1Y': 52, 'ALL': 999 }
  const data = history.slice(-sliceMap[range])

  if (data.length < 2) {
    return (
      <div className="h-40 bg-[#161b26] border border-[#1f2430] rounded-xl mb-4 flex flex-col items-center justify-center text-gray-500 text-sm gap-1">
        <span>📊</span>
        <span>Keep advancing to see the chart</span>
      </div>
    )
  }

  const min    = Math.min(...data)
  const max    = Math.max(...data)
  const range_ = max - min || 1
  const W = 300, H = 100
  const isUp = data[data.length - 1] >= data[0]
  const color = isUp ? '#10b981' : '#ef4444'

  const pts = data.map((p, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((p - min) / range_) * (H - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  // filled area
  const fillPts = `0,${H} ` + pts + ` ${W},${H}`

  return (
    <div className="h-40 bg-[#161b26] border border-[#1f2430] rounded-xl mb-4 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${isUp}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={fillPts} fill={`url(#grad-${isUp})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/* ===============================
   STOCK MODAL (with buy/sell + chart)
================================ */
function StockModal({
  stock,
  onClose,
}: {
  stock: Stock
  onClose: () => void
}) {
  const [range, setRange] = useState<TimeRange>('1M')
  const [qty, setQty]     = useState<number | ''>('')
  const [msg, setMsg]     = useState('')
  const [tab, setTab]     = useState<'buy' | 'sell'>('buy')

  const { buyStock, sellStock, balance, holdings, priceHistory } = usePlayer()

  const holding  = holdings.find(h => h.ticker === stock.ticker)
  const owned    = holding?.quantity ?? 0
  const avgPrice = holding ? holding.totalCost / holding.quantity : 0
  const history  = priceHistory[stock.ticker] ?? []

  function handleBuy() {
    const q = Number(qty)
    if (!q || q <= 0) { setMsg('Enter a valid quantity.'); return }
    const cost = stock.price * q
    if (cost > balance) { setMsg(`Not enough balance. Need €${cost.toLocaleString()}.`); return }
    const ok = buyStock(stock.ticker, q)
    if (ok) { setMsg(`✅ Bought ${q} × ${stock.ticker} for €${cost.toLocaleString()}`); setQty('') }
    else     { setMsg('Purchase failed.') }
  }

  function handleSell() {
    const q = Number(qty)
    if (!q || q <= 0)  { setMsg('Enter a valid quantity.'); return }
    if (q > owned)     { setMsg(`You only own ${owned} shares.`); return }
    const ok = sellStock(stock.ticker, q)
    if (ok) { setMsg(`✅ Sold ${q} × ${stock.ticker} for €${(stock.price * q).toLocaleString()}`); setQty('') }
    else     { setMsg('Sale failed.') }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center px-4 pb-4">
      <div className="bg-[#0f1115] border border-[#1f2430] rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between mb-3">
          <div>
            <div className="text-xl font-bold">{stock.ticker}</div>
            <div className="text-sm text-gray-400">{stock.name}</div>
          </div>
          <button onClick={onClose} className="text-xl text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Price */}
        <div className="flex justify-between items-end mb-4">
          <div className="text-2xl font-bold">€{stock.price}</div>
          <div className={stock.change >= 0 ? 'text-green-400' : 'text-red-400'}>
            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
          </div>
        </div>

        {/* Range selector */}
        <div className="flex gap-2 mb-3">
          {(['1W','1M','3M','1Y','ALL'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-1 rounded-md text-xs font-medium
                ${range === r ? 'bg-green-600 text-white' : 'bg-[#161b26] text-gray-400'}`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* ✅ Real chart */}
        <PriceChart history={history} range={range} />

        {/* Holdings info */}
        {owned > 0 && (
          <div className="bg-[#161b26] border border-[#1f2430] rounded-xl p-3 text-sm mb-4 flex justify-between">
            <span className="text-gray-400">You own</span>
            <span className="font-semibold">{owned} shares · avg €{avgPrice.toFixed(2)}</span>
          </div>
        )}

        {/* Buy / Sell tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => { setTab('buy'); setMsg(''); setQty('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition
              ${tab === 'buy' ? 'bg-green-600 text-white' : 'bg-[#161b26] text-gray-400'}`}
          >
            Buy
          </button>
          <button
            onClick={() => { setTab('sell'); setMsg(''); setQty('') }}
            disabled={owned === 0}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition
              ${tab === 'sell' && owned > 0 ? 'bg-red-600 text-white' : 'bg-[#161b26] text-gray-400 opacity-50'}`}
          >
            Sell {owned > 0 ? `(${owned})` : ''}
          </button>
        </div>

        {/* Qty input */}
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Quantity"
            value={qty}
            onChange={e => { setQty(parseInt(e.target.value) || ''); setMsg('') }}
            className="flex-1 bg-[#161b26] border border-[#1f2430] rounded-xl px-4 py-3
                       text-gray-100 placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
          {qty !== '' && (
            <div className="flex items-center text-sm text-gray-400 px-2">
              = €{(stock.price * Number(qty)).toLocaleString()}
            </div>
          )}
        </div>

        {/* Action button */}
        {tab === 'buy' ? (
          <button
            onClick={handleBuy}
            disabled={!qty || Number(qty) <= 0 || stock.price * Number(qty) > balance}
            className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold
                       hover:bg-green-500 transition
                       disabled:bg-green-900/30 disabled:text-green-700 disabled:cursor-not-allowed"
          >
            Buy {qty ? `${qty} × ${stock.ticker}` : stock.ticker}
          </button>
        ) : (
          <button
            onClick={handleSell}
            disabled={!qty || Number(qty) <= 0 || Number(qty) > owned}
            className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold
                       hover:bg-red-500 transition
                       disabled:bg-red-900/30 disabled:text-red-700 disabled:cursor-not-allowed"
          >
            Sell {qty ? `${qty} × ${stock.ticker}` : stock.ticker}
          </button>
        )}

        {/* Balance hint */}
        <p className="text-xs text-gray-500 text-center mt-2">
          Balance: €{balance.toLocaleString()}
        </p>

        {/* Message */}
        {msg && (
          <p className={`mt-3 text-sm font-medium text-center
            ${msg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
            {msg}
          </p>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400">
        {label}
      </div>
      <div className="font-semibold">
        {value}
      </div>
    </div>
  )
}

export function JobsMarket() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  // ✅ GLOBAL PLAYER STATE
  const { currentJobId, setCurrentJobId, level } = usePlayer()

  const jobs: Job[] = [
    {
      id: 'job-1',
      title: 'Junior Analyst',
      company: 'Local Bank',
      salary: 1800,
      level: 'Entry',
      stability: 'High',
      description: 'Assist senior analysts with financial reports.',
      requiredLevel: 5,
      energyCost: 10,
    },
    {
      id: 'job-2',
      title: 'Marketing Specialist',
      company: 'Tech Startup',
      salary: 2400,
      level: 'Entry',
      stability: 'Medium',
      description: 'Growth marketing and campaign optimization.',
      requiredLevel: 7,
      energyCost: 12,
    },
    {
      id: 'job-3',
      title: 'Software Engineer',
      company: 'CloudCore',
      salary: 4200,
      level: 'Professional',
      stability: 'High',
      description: 'Develop scalable backend services.',
      requiredLevel: 10,
      energyCost: 18,
    },
    {
      id: 'job-4',
      title: 'Investment Associate',
      company: 'Capital Markets Ltd',
      salary: 5200,
      level: 'Professional',
      stability: 'Medium',
      description: 'Deal analysis and portfolio management.',
      requiredLevel: 12,
      energyCost: 20,
    },
    {
      id: 'job-5',
      title: 'Chief Technology Officer',
      company: 'FinTech Group',
      salary: 9800,
      level: 'Executive',
      stability: 'Low',
      description: 'Lead company-wide technology strategy.',
      requiredLevel: 16,
      energyCost: 28,
    },
  ]

  const levels = Array.from(new Set(jobs.map(j => j.level)))

  return (
    <>
      <div className="space-y-8">
        {levels.map(levelGroup => (
          <div key={levelGroup}>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
              {levelGroup} Positions
            </h3>

            <div className="space-y-3">
              {jobs
                .filter(j => j.level === levelGroup)
                .map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    active={job.id === currentJobId}
                    locked={level < job.requiredLevel}
                    onClick={() => setSelectedJob(job)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      {selectedJob && (
        <JobModal
          job={selectedJob}
          isCurrent={selectedJob.id === currentJobId}
          hasJob={currentJobId !== null}
          onApply={() => {
            if (level >= selectedJob.requiredLevel) {
              setCurrentJobId(selectedJob.id)
              setSelectedJob(null)
            }
          }}
          onQuit={() => {
            setCurrentJobId(null)
            setSelectedJob(null)
          }}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </>
  )
}


/* ===============================
   JOB CARD
================================ */
function JobCard({
  job,
  active,
  locked,
  onClick,
}: {
  job: Job
  active: boolean
  locked: boolean
  onClick: () => void
}) {
  const stabilityColor =
    job.stability === 'High'
      ? 'text-green-400'
      : job.stability === 'Medium'
      ? 'text-yellow-400'
      : 'text-red-400'

  return (
    <button
  onClick={locked ? undefined : onClick}
  disabled={locked}
  className={`w-full text-left bg-[#161b26] border rounded-xl p-4 transition
    ${
      active
        ? 'border-green-500/60'
        : locked
        ? 'border-[#1f2430] opacity-50 cursor-not-allowed'
        : 'border-[#1f2430] hover:border-green-500/40'
    }`}
>

      <div className="flex justify-between">
        <div>
          <div className="text-lg font-semibold">
            {job.title}
          </div>
          <div className="text-xs text-gray-400">
            {job.company}
          </div>

          {/* REQUIREMENTS */}
          <div className="mt-2 text-xs text-gray-400 space-y-1">
            <div>🧑‍🎓 Player Level {job.requiredLevel}+</div>
            <div>⭐ Career Reputation (job history)</div>
            <div>⚡ Energy Cost: {job.energyCost}/month</div>
            {job.level !== 'Entry' && (
              <div>💼 Must quit current job</div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="font-semibold">
            €{job.salary.toLocaleString()}/mo
          </div>
          <div className={`text-xs ${stabilityColor}`}>
            {job.stability} Stability
          </div>
        </div>
      </div>
    </button>
  )
}

/* ===============================
   JOB MODAL
================================ */
function JobModal({
  job,
  isCurrent,
  hasJob,
  onApply,
  onQuit,
  onClose,
}: {
  job: Job
  isCurrent: boolean
  hasJob: boolean
  onApply: () => void
  onQuit: () => void
  onClose: () => void
})
 {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="bg-[#0f1115] border border-[#1f2430] rounded-2xl w-full max-w-md p-5">
        <div className="flex justify-between mb-3">
          <div>
            <div className="text-xl font-bold">
              {job.title}
            </div>
            <div className="text-sm text-gray-400">
              {job.company}
            </div>
          </div>
          <button onClick={onClose} className="text-xl">
            ✕
          </button>
        </div>

        <div className="text-2xl font-bold mb-3">
          €{job.salary.toLocaleString()} / month
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <JobStat label="Position Level" value={job.level} />
          <JobStat label="Required Level" value={`${job.requiredLevel}+`} />
          <JobStat label="Energy Cost" value={`-${job.energyCost}/mo`} />
          <JobStat label="Income Type" value="Active" />
        </div>

        <div className="bg-[#161b26] border border-[#1f2430] rounded-xl p-3 text-sm text-gray-400 mb-4">
          <div className="font-semibold text-gray-200 mb-1">
            Work Impact
          </div>
          <div>💰 Monthly salary paid automatically</div>
          <div>⚡ Energy decreases every month</div>
          <div>📈 Staying employed improves career reputation</div>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          {job.description}
        </p>

        <div className="flex gap-3">
  <button
    disabled={isCurrent || hasJob}
    onClick={onApply}
    className={`flex-1 py-3 rounded-xl font-semibold ${
      isCurrent || hasJob
        ? 'bg-green-600/10 text-green-400/40 cursor-not-allowed'
        : 'bg-green-600/20 text-green-400'
    }`}
  >
    {isCurrent ? 'Current Job' : hasJob ? 'Quit current job first' : 'Apply for Job'}
  </button>

  <button
    disabled={!isCurrent}
    onClick={onQuit}
    className={`flex-1 py-3 rounded-xl font-semibold ${
      isCurrent
        ? 'bg-red-600/20 text-red-400'
        : 'bg-red-600/10 text-red-400/40 cursor-not-allowed'
    }`}
  >
    Quit Job
  </button>
</div>

      </div>
    </div>
  )
}

function JobStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <div className="text-xs text-gray-400">
        {label}
      </div>
      <div className="font-semibold">
        {value}
      </div>
    </div>
  )
}
