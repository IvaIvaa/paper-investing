'use client'

import { useEffect, useState, useMemo } from 'react'

import { useRouter } from 'next/navigation'


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
  <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
    <p className="text-sm font-medium text-gray-600">
      {title}
    </p>

    <p
      className={`mt-1 text-3xl font-semibold ${
        color === 'green'
          ? 'text-green-600'
          : color === 'red'
          ? 'text-red-600'
          : 'text-gray-900'
      }`}
    >
      {value}
    </p>

    {sub && (
      <p className="mt-1 text-sm text-gray-500">
        {sub}
      </p>
    )}
  </div>
)

}


export default function DashboardPage() {
  const router = useRouter()

  const [sellError, setSellError] = useState<Record<number, string>>({})

  // BUY INPUT
  const [symbol, setSymbol] = useState('')
  const [buyQty, setBuyQty] = useState<number | ''>('')
  const [inputPrice, setInputPrice] = useState<number | null>(null)
  const [prevInputPrice, setPrevInputPrice] = useState<number | null>(null)
  const [symbolInput, setSymbolInput] = useState('')
const [priceLoading, setPriceLoading] = useState(false)


  // PORTFOLIO
  const [balance, setBalance] = useState(0)
  const [trades, setTrades] = useState<Trade[]>([])
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({})

  // SELL
  const [sellQty, setSellQty] = useState<Record<number, number>>({})

  // UI
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECONDS)
  const [loaded, setLoaded] = useState(false)

const [searchResults, setSearchResults] = useState<
  { symbol: string; name: string }[]
>([])

const [suggestions, setSuggestions] = useState<
  { symbol: string; name: string }[]
>([])



  // 🔐 AUTH
  useEffect(() => {
    const token =
  localStorage.getItem('token') ||
  sessionStorage.getItem('token')

    if (!token) {
      router.push('/login')
      return
    }
    setLoaded(true)
    fetchTrades(token)
    fetchBalance(token)
  }, [router])

  // 🔹 BUY LIVE PRICE
  async function fetchInputPrice(sym: string) {
  if (!sym) return

  setPriceLoading(true)

  try {
    const res = await fetch(`/api/price?symbol=${sym}`)
    let data = null
try {
  data = await res.json()
} catch {
  console.error('Invalid JSON response')
}


    const price =
      data?.results?.[0]?.c ??
      data?.price ??
      null

    if (typeof price === 'number') {
      setPrevInputPrice(inputPrice)
      setInputPrice(price)
    }
  } catch {
  } finally {
    setPriceLoading(false)
  }
}

  async function searchStocks(query: string) {
  if (!query || query.length < 2) {
    setSuggestions([])
    return
  }

  try {
    const res = await fetch(`/api/search?query=${query}`)
    const data = await res.json()
    setSuggestions(data.slice(0, 5))
  } catch {
    setSuggestions([])
  }
}


  // 📊 TRADES
  async function fetchTrades(token: string) {
    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })

    const data: Trade[] = await res.json()
    setTrades(data)

    const symbols = [...new Set(data.map(t => t.symbol))]
    if (symbols.length > 0) {
      await fetchLivePrices(symbols) // 🔥 immediate price fetch
    }
  }

  // 💰 BALANCE
  async function fetchBalance(token: string) {
    const res = await fetch('/api/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    const data = await res.json()
    setBalance(data.balance)
  } 


  // 🔄 LIVE PRICES
  async function fetchLivePrices(symbols: string[]) {
  if (!symbols.length) return

  try {
    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
    })

    const data: Record<string, number> = await res.json()

    setPrevPrices(livePrices)
    setLivePrices(prev => ({ ...prev, ...data }))
  } catch {}
}




  // ⏱ AUTO REFRESH + COUNTDOWN
  useEffect(() => {
    if (!trades.length) return
    const symbols = [...new Set(trades.map(t => t.symbol))]

    const refresh = setInterval(() => {
      fetchLivePrices(symbols)
      setSecondsLeft(REFRESH_SECONDS)
    }, REFRESH_SECONDS * 1000)

    const countdown = setInterval(() => {
      setSecondsLeft(s => (s > 1 ? s - 1 : 1))
    }, 1000)

    return () => {
      clearInterval(refresh)
      clearInterval(countdown)
    }
  }, [trades])

  // 🎨 COLORS
  function inputPriceColor() {
    if (prevInputPrice == null || inputPrice == null) return ''
    if (inputPrice > prevInputPrice) return 'text-green-600 font-semibold'
    if (inputPrice < prevInputPrice) return 'text-red-600 font-semibold'
    return ''
  }

  function tablePriceColor(sym: string) {
    if (prevPrices[sym] == null || livePrices[sym] == null) return ''
    if (livePrices[sym] > prevPrices[sym]) return 'text-green-600 font-semibold'
    if (livePrices[sym] < prevPrices[sym]) return 'text-red-600 font-semibold'
    return ''
  }

  function plData(trade: Trade) {
  const current = livePrices[trade.symbol]
  if (typeof current !== 'number') return null

  const avgBuy = trade.price / trade.quantity
  const EPSILON = 0.001
  const priceDiff = current - avgBuy

  if (Math.abs(priceDiff) <= EPSILON) {
    return {
      dollarPL: 0,
      percentPL: 0,
      isNeutral: true,
    }
  }

  const dollarPL = priceDiff * trade.quantity
  const percentPL = (priceDiff / avgBuy) * 100

  return {
    dollarPL,
    percentPL,
    isNeutral: false,
  }
}

function portfolioStockValue() {
  let value = 0

  for (const trade of trades.filter(t => t.type === 'BUY')) {
    const current = livePrices[trade.symbol]
    if (typeof current !== 'number') continue

    value += current * trade.quantity
  }

  return value
}



function portfolioPL() {
  let totalDollar = 0
  let totalCost = 0
  const EPSILON = 0.0001

  const buyTrades = trades.filter(t => t.type === 'BUY')

  // No positions → no P/L
  if (buyTrades.length === 0) {
    return { dollar: 0, percent: 0 }
  }

  for (const trade of buyTrades) {
    const current = livePrices[trade.symbol]

    // Skip if price not loaded yet
    if (typeof current !== 'number') continue
    if (!trade.quantity || !trade.price) continue

    const avgBuy = trade.price / trade.quantity
    const diff = current - avgBuy

    // Ignore tiny float noise
    if (Math.abs(diff) < EPSILON) continue

    totalDollar += diff * trade.quantity
    totalCost += trade.price
  }

  // Still no valid data → zero P/L
  if (totalCost === 0) {
    return { dollar: 0, percent: 0 }
  }

  return {
    dollar: totalDollar,
    percent: (totalDollar / totalCost) * 100
  }
}


const totalPL = portfolioPL()
const stockValue = portfolioStockValue()


  


  // 🟢 BUY
  async function buyStock() {
    const token = localStorage.getItem('token')
    if (!token || !symbol || !buyQty || inputPrice == null) return
    if (inputPrice * buyQty > balance) return

    await fetch('/api/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        quantity: buyQty,
        price: inputPrice * buyQty,
        type: 'BUY',
        token
      })
    })

    setSymbol('')
    setBuyQty('')
    setInputPrice(null)
    setPrevInputPrice(null)
    fetchTrades(token)
    fetchBalance(token)
  }

  // 🔴 SELL
  async function sellStock(trade: Trade) {
  const token = localStorage.getItem('token')
  const qty = sellQty[trade.id]

  // basic validation
  if (!token || !qty || qty <= 0) return

  // ❌ trying to sell more than owned
  if (qty > trade.quantity) {
    setSellError(prev => ({
      ...prev,
      [trade.id]: `You only own ${trade.quantity} shares`
    }))
    return
  }

  // ✅ clear error if valid
  setSellError(prev => ({
    ...prev,
    [trade.id]: ''
  }))

  await fetch('/api/trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tradeId: trade.id,
      symbol: trade.symbol,
      quantity: qty,
      type: 'SELL',
      token
    })
  })

  setSellQty({})
  fetchTrades(token)
  fetchBalance(token)
}


  if (!loaded) return null

  return (
    
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    
    {/* Brand */}
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-lg bg-black text-white flex items-center justify-center font-bold">
        PG
      </div>
      <span className="text-lg font-semibold text-gray-900">
        Paper Gain
      </span>
    </div>

    {/* Actions */}
    <button
  onClick={() => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    router.push('/login')
  }}
  className="px-4 py-2 rounded-lg text-sm font-medium
             text-gray-700 hover:text-red-600
             hover:bg-red-50 transition"
>
  Logout
</button>


  </div>
</header>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <h1 className="text-2xl font-bold mb-4 text-gray-900">
  Paper Trading Dashboard
</h1>

      

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
  <StatCard
    title="Balance"
    value={`$${balance.toFixed(2)}`}
  />

  <StatCard
    title="Portfolio Value"
    value={`$${stockValue.toFixed(2)}`}
  />

  <StatCard
    title="Total P/L"
    value={`${totalPL.dollar >= 0 ? '+' : ''}$${totalPL.dollar.toFixed(2)}`}
    sub={`${totalPL.percent.toFixed(2)}%`}
    color={totalPL.dollar >= 0 ? 'green' : 'red'}
  />
</div>




      {/* BUY */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-[160px_100px_auto] gap-3 items-end">

  <div className="relative w-full sm:w-40">
  <input
    className="w-full h-[44px] rounded-lg border border-gray-300
           px-3 text-gray-900 placeholder-gray-400
           focus:outline-none focus:ring-2 focus:ring-black"


    placeholder="AAPL"
    value={symbolInput}
    onChange={e => {
      const v = e.target.value
      setSymbolInput(v)

      if (v.length >= 3) {
        searchStocks(v)
      } else {
        setSuggestions([])
      }
    }}
  />

  {symbolInput.length > 0 && symbolInput.length < 3 && (
  <span className="absolute -top-5 left-1 text-xs text-red-400 pointer-events-none">
    Enter at least 3 letters
  </span>
)}



  {suggestions.length > 0 && (
    <div className="absolute top-full left-0 right-0 bg-white border rounded shadow z-10 max-h-60 overflow-y-auto">
      {suggestions.map(s => (
        <div
          key={s.symbol}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
          onClick={() => {
            setSymbolInput(s.symbol)
            setSymbol(s.symbol)
            setSuggestions([])
            fetchInputPrice(s.symbol)
          }}
        >
          <div className="font-semibold">{s.symbol}</div>
          <div className="text-xs text-gray-600 truncate">
            {s.name}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
    <input
      type="number"
      className="w-full h-[44px] rounded-lg border border-gray-300
           px-3 text-gray-900 placeholder-gray-400
           focus:outline-none focus:ring-2 focus:ring-black"

      placeholder="Qty"
      value={buyQty}
      onChange={e => setBuyQty(Number(e.target.value))}
    />
    <button
      onClick={buyStock}
      disabled={!inputPrice || !buyQty || inputPrice * buyQty > balance}
      className="
  w-full sm:w-auto
  bg-gray-800 text-white
  px-6 py-2 rounded-lg
  hover:bg-gray-900
  active:bg-black
  active:scale-95
  transition-all
  disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
"



    >
      Buy
    </button>
    </div>
</div>

      {priceLoading && (
  <p className="mb-1 text-sm text-gray-500">
    Fetching live price…
  </p>
)}


      {inputPrice !== null && (
        <p
  className={`mb-1 text-sm font-medium ${
    inputPriceColor() || 'text-gray-700'
  }`}
>
  Live price: ${inputPrice.toFixed(2)}
</p>

      )}

      {inputPrice !== null && buyQty !== '' && (
        <p
  className={`mb-6 text-sm font-semibold ${
    inputPriceColor() || 'text-gray-800'
  }`}
>
  Total cost: ${(inputPrice * buyQty).toFixed(2)}
</p>

      )}

      {/* TABLE */}
  <div className="bg-white rounded-2xl shadow-md overflow-hidden">
  <div className="overflow-x-auto">

  <table className="w-full text-sm text-gray-700">
        <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
          <tr className="hover:bg-gray-50 transition">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Symbol</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Qty</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Live Price</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Total Cost</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">P/L</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Sell Qty</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody>
          {trades.filter(t => t.type === 'BUY' ).map(trade => {
            const pl = plData(trade)
            return (
              <tr className="hover:bg-gray-50 transition">
                <td className="px-4 py-4 whitespace-nowrap">{trade.symbol}</td>
                <td className="px-4 py-4 whitespace-nowrap">{trade.quantity}</td>

                <td className={`px-4 py-4 whitespace-nowrap ${tablePriceColor(trade.symbol)}`}>
                  {typeof livePrices[trade.symbol] === 'number'
  ? `$${livePrices[trade.symbol].toFixed(2)}`
  : `$${(trade.price / trade.quantity).toFixed(2)}`}

                </td>

                <td className={`px-4 py-4 whitespace-nowrap ${tablePriceColor(trade.symbol)}`}>
                  ${trade.price.toFixed(2)}
                </td>

                <td
  className={`px-4 py-4 whitespace-nowrap ${
    !pl
      ? 'text-gray-400'
      : pl.dollarPL === 0
      ? 'text-gray-400'
      : pl.dollarPL > 0
      ? 'text-green-600'
      : 'text-red-600'
  }`}
>

                  {pl ? (
                    <>
                      <div>
                        {pl.percentPL > 0 ? '+' : ''}
                        {pl.percentPL.toFixed(2)}%
                      </div>
                      <div className="text-xs">
                        ({pl.dollarPL > 0 ? '+' : ''}
                        ${pl.dollarPL.toFixed(2)})
                      </div>
                    </>
                  ) : (
                    '—'
                  )}
                </td>

                <td className="px-4 py-4 whitespace-nowrap">
                  <input
  type="number"
  min={1}
  className="
    w-20 px-2 py-1.5
    rounded-lg
    bg-gray-50
    border border-gray-300
    text-center text-sm text-gray-900
    placeholder-gray-400
    focus:outline-none
    focus:ring-2 focus:ring-black
    focus:border-black
    transition
  "
  placeholder="Qty"
  value={sellQty[trade.id] || ''}
  onChange={e => {
    const value = Number(e.target.value)

    setSellQty(prev => ({
      ...prev,
      [trade.id]: value
    }))

    setSellError(prev => ({
      ...prev,
      [trade.id]: ''
    }))
  }}
/>


{sellError[trade.id] && (
  <p className="text-xs text-red-600 mt-1">
    {sellError[trade.id]}
  </p>
)}

                </td>

                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    onClick={() => sellStock(trade)}
                    className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-800"
                  >
                    Sell
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
      </div>

      {/* COUNTDOWN */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow">
        Next price update in <strong>{secondsLeft}s</strong>
      </div>
      </div>
      </div>
    </main>
  )
}
