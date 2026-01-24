'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

type Trade = {
  id: number
  symbol: string
  quantity: number
  price: number // total cost
  type: 'BUY' | 'SELL'
}

const REFRESH_SECONDS = 30

export default function DashboardPage() {
  const router = useRouter()

  // AUTH
  const [loaded, setLoaded] = useState(false)

  // BUY
  const [symbol, setSymbol] = useState('')
  const [buyQty, setBuyQty] = useState<number | ''>('')
  const [inputPrice, setInputPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)

  // DATA
  const [balance, setBalance] = useState(0)
  const [trades, setTrades] = useState<Trade[]>([])
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({})

  // SELL
  const [sellQty, setSellQty] = useState<Record<number, number>>({})
  const [sellError, setSellError] = useState<Record<number, string>>({})

  // UI
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECONDS)

  // =====================
  // AUTH CHECK
  // =====================
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    setLoaded(true)
    fetchTrades(token)
    fetchBalance(token)
  }, [router])

  // =====================
  // PORTFOLIO STATS (SINGLE SOURCE OF TRUTH)
  // =====================
  const portfolioStats = useMemo(() => {
    let value = 0
    let cost = 0
    let pl = 0
    const EPSILON = 0.01

    for (const t of trades) {
      if (t.type !== 'BUY' || t.quantity <= 0) continue

      const live = livePrices[t.symbol]
      if (typeof live !== 'number') continue

      value += live * t.quantity
      cost += t.price

      const avg = t.price / t.quantity
      const diff = live - avg

      if (Math.abs(diff) >= EPSILON) {
        pl += diff * t.quantity
      }
    }

    return {
      value,
      pl,
      percent: cost > 0 ? (pl / cost) * 100 : 0
    }
  }, [trades, livePrices])

  // =====================
  // PER-ROW P/L
  // =====================
  function plData(trade: Trade) {
    if (trade.quantity <= 0) return null

    const live = livePrices[trade.symbol]
    if (typeof live !== 'number') return null

    const avg = trade.price / trade.quantity
    if (!isFinite(avg)) return null

    const diff = live - avg
    if (Math.abs(diff) < 0.01) {
      return { dollar: 0, percent: 0 }
    }

    const dollar = diff * trade.quantity
    const percent = (diff / avg) * 100

    return { dollar, percent }
  }

  // =====================
  // FETCH BUY PRICE
  // =====================
  async function fetchInputPrice(sym: string) {
    if (!sym) return
    setPriceLoading(true)

    try {
      const res = await fetch(`/api/price?symbol=${sym}`)
      const data = await res.json()
      const price =
        data?.results?.[0]?.c ??
        data?.price ??
        null

      if (typeof price === 'number') {
        setInputPrice(price)
      }
    } catch {
    } finally {
      setPriceLoading(false)
    }
  }

  // =====================
  // FETCH TRADES
  // =====================
  async function fetchTrades(token: string) {
    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })

    const data: Trade[] = await res.json()
    setTrades(data)

    const symbols = [...new Set(data.map(t => t.symbol))]
    if (symbols.length) fetchLivePrices(symbols)
  }

  // =====================
  // FETCH BALANCE
  // =====================
  async function fetchBalance(token: string) {
    const res = await fetch('/api/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    const data = await res.json()
    setBalance(data.balance)
  }

  // =====================
  // FETCH LIVE PRICES
  // =====================
  async function fetchLivePrices(symbols: string[]) {
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      })

      const data: Record<string, number> = await res.json()
      setPrevPrices(livePrices)
      setLivePrices(prev => ({ ...prev, ...data }))
    } catch {}
  }

  // =====================
  // AUTO REFRESH
  // =====================
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

  // =====================
  // BUY
  // =====================
  async function buyStock() {
    const token = localStorage.getItem('token')
    if (!token || !symbol || !buyQty || inputPrice == null) return
    if (inputPrice * buyQty > balance) return

    await fetch('/api/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        symbol,
        quantity: buyQty,
        price: inputPrice * buyQty,
        type: 'BUY'
      })
    })

    setSymbol('')
    setBuyQty('')
    setInputPrice(null)
    fetchTrades(token)
    fetchBalance(token)
  }

  // =====================
  // SELL
  // =====================
  async function sellStock(trade: Trade) {
    const token = localStorage.getItem('token')
    const qty = sellQty[trade.id]

    if (!token || !qty || qty <= 0) return
    if (qty > trade.quantity) {
      setSellError({ [trade.id]: `You own ${trade.quantity}` })
      return
    }

    await fetch('/api/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        tradeId: trade.id,
        quantity: qty,
        type: 'SELL'
      })
    })

    setSellQty({})
    fetchTrades(token)
    fetchBalance(token)
  }

  if (!loaded) return null

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Paper Trading Dashboard</h1>

      <p className="text-lg mb-1">
        Balance: <strong className="text-green-600">${balance.toFixed(2)}</strong>
      </p>

      <p className="text-lg mb-1">
        Portfolio Value:{' '}
        <strong className="text-blue-600">${portfolioStats.value.toFixed(2)}</strong>
      </p>

      <p className={`text-lg mb-6 ${
        portfolioStats.pl > 0 ? 'text-green-600' :
        portfolioStats.pl < 0 ? 'text-red-600' : ''
      }`}>
        Portfolio P/L:{' '}
        <strong>
          {portfolioStats.pl > 0 ? '+' : ''}
          ${portfolioStats.pl.toFixed(2)} ({portfolioStats.percent.toFixed(2)}%)
        </strong>
      </p>

      {/* BUY */}
      <div className="flex gap-3 mb-4">
        <input
          className="border p-2 w-32"
          placeholder="AAPL"
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          onBlur={() => fetchInputPrice(symbol)}
        />
        <input
          type="number"
          className="border p-2 w-24"
          placeholder="Qty"
          value={buyQty}
          onChange={e => setBuyQty(Number(e.target.value))}
        />
        <button
          onClick={buyStock}
          disabled={!inputPrice || !buyQty || inputPrice * Number(buyQty) > balance}
          className="bg-green-600 text-white px-6 py-2 rounded disabled:bg-gray-300"
        >
          Buy
        </button>
      </div>

      {priceLoading && <p className="text-sm text-gray-500">Fetching price…</p>}
      {inputPrice && <p className="text-sm">Live price: ${inputPrice.toFixed(2)}</p>}

      {/* TABLE */}
      <table className="border-collapse border w-full mt-6">
        <thead className="bg-red-600 text-white">
          <tr>
            <th className="border px-2">Symbol</th>
            <th className="border px-2">Qty</th>
            <th className="border px-2">Live</th>
            <th className="border px-2">Cost</th>
            <th className="border px-2">P/L</th>
            <th className="border px-2">Sell</th>
          </tr>
        </thead>
        <tbody>
          {trades.filter(t => t.type === 'BUY' && t.quantity > 0).map(trade => {
            const pl = plData(trade)
            return (
              <tr key={trade.id}>
                <td className="border px-2">{trade.symbol}</td>
                <td className="border px-2">{trade.quantity}</td>
                <td className="border px-2">
                  ${livePrices[trade.symbol]?.toFixed(2) ?? '—'}
                </td>
                <td className="border px-2">${trade.price.toFixed(2)}</td>
                <td className="border px-2">
                  {pl
                    ? `${pl.dollar >= 0 ? '+' : ''}${pl.dollar.toFixed(2)} (${pl.percent.toFixed(2)}%)`
                    : '—'}
                </td>
                <td className="border px-2">
                  <input
                    type="number"
                    className="border w-16 mr-2"
                    value={sellQty[trade.id] || ''}
                    onChange={e =>
                      setSellQty({ [trade.id]: Number(e.target.value) })
                    }
                    onKeyDown={e => e.key === 'Enter' && sellStock(trade)}
                  />
                  <button
                    onClick={() => sellStock(trade)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Sell
                  </button>
                  {sellError[trade.id] && (
                    <div className="text-xs text-red-600">
                      {sellError[trade.id]}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="fixed bottom-4 right-4 text-sm text-gray-600">
        Next update in {secondsLeft}s
      </div>
    </main>
  )
}
