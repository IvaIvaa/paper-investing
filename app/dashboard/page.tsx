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
    <main className="p-8 max-w-6xl mx-auto relative">
      <h1 className="text-2xl font-bold mb-2">Paper Trading Dashboard</h1>

  <div className="mb-4 text-base sm:text-lg flex flex-col sm:flex-row gap-2 sm:gap-6">

  <p>
    Balance:{' '}
    <strong className="text-green-700">
      ${balance.toFixed(2)}
    </strong>
  </p>

  <p>
    Portfolio Value:{' '}
    <strong className="text-blue-600">
      ${stockValue.toFixed(2)}
    </strong>
  </p>
</div>


         <p
  className={`mb-6 text-lg ${
    totalPL.dollar > 0
      ? 'text-green-600'
      : totalPL.dollar < 0
      ? 'text-red-600'
      : ''
  }`}
>
  Portfolio P/L:{' '}
  <strong>
    {totalPL.dollar > 0 ? '+' : ''}
    ${totalPL.dollar.toFixed(2)}
    {' '}
    ({totalPL.percent > 0 ? '+' : ''}
    {totalPL.percent.toFixed(2)}%)
  </strong>
</p>



      {/* BUY */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end mb-4">
        <div className="relative w-48">
  <input
  className="border p-2 w-full"
  placeholder="AAPL"
  value={symbolInput}
  onChange={e => {
  const v = e.target.value
  setSymbolInput(v)

  if (v.length >= 3) {
    searchStocks(v)
  } else {
    setSuggestions([])   // ✅ clear dropdown
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
          className="border p-2 w-full sm:w-24"
          placeholder="Qty"
          value={buyQty}
          onChange={e => setBuyQty(Number(e.target.value))}
        />
        <button
          onClick={buyStock}
          disabled={!inputPrice || !buyQty || inputPrice * buyQty > balance}
          className="bg-green-600 text-white px-6 py-2 rounded w-full sm:w-auto disabled:bg-gray-300"
        >
          Buy
        </button>
      </div>

      {priceLoading && (
  <p className="mb-1 text-sm text-gray-500">
    Fetching live price…
  </p>
)}


      {inputPrice !== null && (
        <p className={`mb-1 text-sm ${inputPriceColor()}`}>
          Live price: ${inputPrice.toFixed(2)}
        </p>
      )}

      {inputPrice !== null && buyQty !== '' && (
        <p className={`mb-6 text-sm ${inputPriceColor()}`}>
          Total cost: ${(inputPrice * buyQty).toFixed(2)}
        </p>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto">
  <table className="border-collapse border w-full min-w-[800px]">
        <thead className="bg-red-600 text-white">
          <tr>
            <th className="border px-3 py-2">Symbol</th>
            <th className="border px-3 py-2">Qty</th>
            <th className="border px-3 py-2">Live Price</th>
            <th className="border px-3 py-2">Total Cost</th>
            <th className="border px-3 py-2">P/L</th>
            <th className="border px-3 py-2">Sell Qty</th>
            <th className="border px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {trades.filter(t => t.type === 'BUY' ).map(trade => {
            const pl = plData(trade)
            return (
              <tr key={trade.id}>
                <td className="border px-2 sm:px-3 py-2 text-sm sm:text-base">{trade.symbol}</td>
                <td className="border px-3 py-2">{trade.quantity}</td>

                <td className={`border px-3 py-2 ${tablePriceColor(trade.symbol)}`}>
                  {typeof livePrices[trade.symbol] === 'number'
  ? `$${livePrices[trade.symbol].toFixed(2)}`
  : `$${(trade.price / trade.quantity).toFixed(2)}`}

                </td>

                <td className={`border px-3 py-2 ${tablePriceColor(trade.symbol)}`}>
                  ${trade.price.toFixed(2)}
                </td>

                <td
                  className={`border px-3 py-2 ${
                    pl
                      ? pl.dollarPL > 0
                        ? 'text-green-600 font-semibold'
                        : 'text-red-600 font-semibold'
                      : ''
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

                <td className="border px-3 py-2 text-center">
                  <input
                    type="number"
                    className="border w-20 text-center"
                    value={sellQty[trade.id] || ''}
                    onChange={e => {
                      const value = Number(e.target.value)

                      setSellQty(prev => ({
                        ...prev,
                        [trade.id]: value
                      }))

                      // clear error while typing
                      setSellError(prev => ({
                        ...prev,
                        [trade.id]: ''
                      }))
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        sellStock(trade)
                      }
                    }}
                  />

{sellError[trade.id] && (
  <p className="text-xs text-red-600 mt-1">
    {sellError[trade.id]}
  </p>
)}

                </td>

                <td className="border px-3 py-2 text-center">
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

      {/* COUNTDOWN */}
      <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 text-xs sm:text-sm text-gray-600 bg-white px-3 py-1 rounded shadow">
        Next price update in <strong>{secondsLeft}s</strong>
      </div>
    </main>
  )
}
