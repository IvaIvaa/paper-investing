'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Trade = {
  id: number
  symbol: string
  quantity: number
  price: number   // stored as totalCost in DB
  type: 'BUY' | 'SELL'
}

type Toast = {
  id: number
  msg: string
  type: 'success' | 'error'
}

const REFRESH_SECONDS = 30

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

function clearToken() {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

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
      <p className="text-sm font-medium text-gray-600">{title}</p>
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
      {sub && <p className="mt-1 text-sm text-gray-500">{sub}</p>}
    </div>
  )
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium
            transition-all animate-in fade-in slide-in-from-right-4 duration-300
            ${t.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  // ── State ──
  const [balance, setBalance]       = useState(0)
  const [trades, setTrades]         = useState<Trade[]>([])
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({})

  const [symbolInput, setSymbolInput]   = useState('')
  const [symbol, setSymbol]             = useState('')
  const [buyQty, setBuyQty]             = useState<number | ''>('')
  const [inputPrice, setInputPrice]     = useState<number | null>(null)
  const [prevInputPrice, setPrevInputPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)

  const [suggestions, setSuggestions]   = useState<{ symbol: string; name: string }[]>([])
  const [sellQty, setSellQty]           = useState<Record<number, number>>({})
  const [sellError, setSellError]       = useState<Record<number, string>>({})

  const [secondsLeft, setSecondsLeft]   = useState(REFRESH_SECONDS)
  const [loaded, setLoaded]             = useState(false)
  const [toasts, setToasts]             = useState<Toast[]>([])
  let toastId = 0

  // ── Toast helper ──
  function showToast(msg: string, type: 'success' | 'error' = 'error') {
    const id = ++toastId
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  // ── Auth guard ──
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }
    setLoaded(true)
    fetchTrades(token)
    fetchBalance(token)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Handle 401 globally: redirect to login ──
  function handleUnauthorized() {
    clearToken()
    router.push('/login')
  }

  // ── Fetch balance ──
  async function fetchBalance(token: string) {
    try {
      const res = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.status === 401) { handleUnauthorized(); return }
      if (!res.ok) { showToast('Failed to load balance.'); return }
      const data = await res.json()
      setBalance(data.balance)
    } catch {
      showToast('Network error while loading balance.')
    }
  }

  // ── Fetch trades ──
  async function fetchTrades(token: string) {
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.status === 401) { handleUnauthorized(); return }
      if (!res.ok) { showToast('Failed to load portfolio.'); return }
      const data: Trade[] = await res.json()
      setTrades(data)
      const symbols = [...new Set(data.map(t => t.symbol))]
      if (symbols.length > 0) await fetchLivePrices(symbols)
    } catch {
      showToast('Network error while loading portfolio.')
    }
  }

  // ── Live price refresh ──
  const fetchLivePrices = useCallback(async (symbols: string[]) => {
    if (!symbols.length) return
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      })
      if (!res.ok) { showToast('Failed to refresh prices.'); return }
      const data: Record<string, number> = await res.json()
      setPrevPrices(prev => ({ ...prev }))
      setLivePrices(prev => {
        setPrevPrices(prev)
        return { ...prev, ...data }
      })
    } catch {
      showToast('Network error while refreshing prices.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-refresh + countdown ──
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
  }, [trades, fetchLivePrices])

  // ── Fetch price for buy form ──
  async function fetchInputPrice(sym: string) {
    if (!sym) return
    setPriceLoading(true)
    try {
      const res = await fetch(`/api/price?symbol=${encodeURIComponent(sym)}`)
      if (!res.ok) { showToast(`Could not fetch price for ${sym}.`); return }
      const data = await res.json()
      const price = data?.results?.[0]?.c ?? data?.price ?? null
      if (typeof price === 'number') {
        setPrevInputPrice(inputPrice)
        setInputPrice(price)
      } else {
        showToast(`No price data found for "${sym}".`)
      }
    } catch {
      showToast('Network error while fetching price.')
    } finally {
      setPriceLoading(false)
    }
  }

  // ── Stock search / autocomplete ──
  async function searchStocks(query: string) {
    if (!query || query.length < 2) { setSuggestions([]); return }
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`)
      if (!res.ok) { setSuggestions([]); return }
      const data = await res.json()
      setSuggestions(data.slice(0, 5))
    } catch {
      setSuggestions([])
    }
  }

  // ── Price color helpers ──
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

  // ── P/L calculations ──
  function plData(trade: Trade) {
    const current = livePrices[trade.symbol]
    if (typeof current !== 'number') return null
    const avgBuy = trade.price / trade.quantity
    const priceDiff = current - avgBuy
    const dollarPL = priceDiff * trade.quantity
    const percentPL = (priceDiff / avgBuy) * 100
    return { dollarPL, percentPL }
  }

  function portfolioStockValue() {
    return trades
      .filter(t => t.type === 'BUY')
      .reduce((sum, t) => {
        const price = livePrices[t.symbol]
        return typeof price === 'number' ? sum + price * t.quantity : sum
      }, 0)
  }

  function portfolioPL() {
    const buyTrades = trades.filter(t => t.type === 'BUY')
    if (!buyTrades.length) return { dollar: 0, percent: 0 }

    let totalDollar = 0
    let totalCost = 0

    for (const trade of buyTrades) {
      const current = livePrices[trade.symbol]
      if (typeof current !== 'number' || !trade.quantity || !trade.price) continue
      const avgBuy = trade.price / trade.quantity
      totalDollar += (current - avgBuy) * trade.quantity
      totalCost += trade.price
    }

    if (totalCost === 0) return { dollar: 0, percent: 0 }
    return { dollar: totalDollar, percent: (totalDollar / totalCost) * 100 }
  }

  const totalPL   = portfolioPL()
  const stockValue = portfolioStockValue()

  // ── BUY ──
  async function buyStock() {
    const token = getToken()
    if (!token || !symbol || !buyQty || inputPrice == null) return

    const qty = Number(buyQty)
    if (!Number.isInteger(qty) || qty <= 0) {
      showToast('Quantity must be a positive whole number.')
      return
    }

    const totalCost = inputPrice * qty
    if (totalCost > balance) {
      showToast('Insufficient balance for this purchase.')
      return
    }

    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, quantity: qty, price: totalCost, type: 'BUY', token }),
      })
      if (res.status === 401) { handleUnauthorized(); return }
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Buy failed.'); return }

      showToast(`Bought ${qty} share${qty > 1 ? 's' : ''} of ${symbol}!`, 'success')
      setSymbolInput('')
      setSymbol('')
      setBuyQty('')
      setInputPrice(null)
      setPrevInputPrice(null)
      setSuggestions([])
      fetchTrades(token)
      fetchBalance(token)
    } catch {
      showToast('Network error during purchase.')
    }
  }

  // ── SELL ──
  async function sellStock(trade: Trade) {
    const token = getToken()
    const qty = sellQty[trade.id]

    if (!token || !qty || qty <= 0) return

    if (!Number.isInteger(qty)) {
      setSellError(prev => ({ ...prev, [trade.id]: 'Quantity must be a whole number.' }))
      return
    }

    if (qty > trade.quantity) {
      setSellError(prev => ({ ...prev, [trade.id]: `You only own ${trade.quantity} shares.` }))
      return
    }

    setSellError(prev => ({ ...prev, [trade.id]: '' }))

    // ✅ Pass the current market price so sell proceeds use live price
    const currentPrice = livePrices[trade.symbol]

    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId: trade.id,
          symbol: trade.symbol,
          quantity: qty,
          currentPrice,   // ← live market price used for proceeds
          type: 'SELL',
          token,
        }),
      })
      if (res.status === 401) { handleUnauthorized(); return }
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Sell failed.'); return }

      showToast(`Sold ${qty} share${qty > 1 ? 's' : ''} of ${trade.symbol}!`, 'success')
      setSellQty(prev => { const next = { ...prev }; delete next[trade.id]; return next })
      fetchTrades(token)
      fetchBalance(token)
    } catch {
      showToast('Network error during sale.')
    }
  }

  // ── Logout ──
  function logout() {
    clearToken()
    router.push('/login')
  }

  if (!loaded) return null

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4 py-8">

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} />

      {/* FRAME */}
      <div className="w-full max-w-[1100px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">

        {/* INNER CONTENT */}
        <div className="px-6 py-6 space-y-8">

          {/* ── HEADER ── */}
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                  PG
                </div>
                <span className="text-lg font-semibold text-gray-900">Paper Gain</span>
              </div>
              <button
                onClick={logout}
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

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard title="Balance" value={`$${balance.toFixed(2)}`} />
              <StatCard title="Portfolio Value" value={`$${stockValue.toFixed(2)}`} />
              <StatCard
                title="Total P/L"
                value={`${totalPL.dollar >= 0 ? '+' : ''}$${totalPL.dollar.toFixed(2)}`}
                sub={`${totalPL.percent.toFixed(2)}%`}
                color={totalPL.dollar >= 0 ? 'green' : 'red'}
              />
            </div>

            {/* ── BUY PANEL ── */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-[160px_100px_auto] gap-3 items-end">

                {/* Symbol input + autocomplete */}
                <div className="relative w-full sm:w-40">
                  {symbolInput.length > 0 && symbolInput.length < 3 && (
                    <span className="absolute -top-5 left-1 text-xs text-red-400 pointer-events-none">
                      Enter at least 3 letters
                    </span>
                  )}
                  <input
                    className="w-full h-[44px] rounded-lg border border-gray-300
                               px-3 text-gray-900 placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="AAPL"
                    value={symbolInput}
                    onChange={e => {
                      const v = e.target.value.toUpperCase()
                      setSymbolInput(v)
                      if (v.length >= 3) searchStocks(v)
                      else setSuggestions([])
                    }}
                  />

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
                          <div className="text-xs text-gray-600 truncate">{s.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantity input — whole numbers only */}
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="w-full h-[44px] rounded-lg border border-gray-300
                             px-3 text-gray-900 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Qty"
                  value={buyQty}
                  onChange={e => {
                    const v = parseInt(e.target.value, 10)
                    setBuyQty(isNaN(v) ? '' : Math.max(1, v))
                  }}
                />

                <button
                  onClick={buyStock}
                  disabled={!inputPrice || !buyQty || !symbol || (inputPrice * Number(buyQty) > balance)}
                  className="w-full sm:w-auto bg-gray-800 text-white
                             px-6 py-2 rounded-lg hover:bg-gray-900
                             active:bg-black active:scale-95 transition-all
                             disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Buy
                </button>
              </div>

              {/* Price / cost display */}
              {priceLoading && (
                <p className="mt-2 text-sm text-gray-500">Fetching live price…</p>
              )}
              {inputPrice !== null && (
                <p className={`mt-2 text-sm font-medium ${inputPriceColor() || 'text-gray-700'}`}>
                  Live price: ${inputPrice.toFixed(2)}
                </p>
              )}
              {inputPrice !== null && buyQty !== '' && (
                <p className={`mt-1 text-sm font-semibold ${inputPriceColor() || 'text-gray-800'}`}>
                  Total cost: ${(inputPrice * Number(buyQty)).toFixed(2)}
                </p>
              )}
            </div>

            {/* ── HOLDINGS TABLE ── */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-700">
                  <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500">Symbol</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500">Qty</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500">Live Price</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500">Total Cost</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500">P/L</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500">Sell Qty</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.filter(t => t.type === 'BUY').length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                          No holdings yet. Search for a stock above to get started.
                        </td>
                      </tr>
                    )}
                    {trades.filter(t => t.type === 'BUY').map(trade => {
                      const pl = plData(trade)
                      return (
                        <tr key={trade.id} className="hover:bg-gray-50 transition border-t border-gray-100">
                          <td className="px-4 py-4 font-semibold whitespace-nowrap">{trade.symbol}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{trade.quantity}</td>

                          <td className={`px-4 py-4 whitespace-nowrap ${tablePriceColor(trade.symbol)}`}>
                            {typeof livePrices[trade.symbol] === 'number'
                              ? `$${livePrices[trade.symbol].toFixed(2)}`
                              : `$${(trade.price / trade.quantity).toFixed(2)}`}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
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
                                <div>{pl.percentPL > 0 ? '+' : ''}{pl.percentPL.toFixed(2)}%</div>
                                <div className="text-xs">
                                  ({pl.dollarPL > 0 ? '+' : ''}${pl.dollarPL.toFixed(2)})
                                </div>
                              </>
                            ) : '—'}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              className="w-20 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-300
                                         text-center text-sm text-gray-900 placeholder-gray-400
                                         focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
                              placeholder="Qty"
                              value={sellQty[trade.id] || ''}
                              onChange={e => {
                                const v = parseInt(e.target.value, 10)
                                setSellQty(prev => ({ ...prev, [trade.id]: isNaN(v) ? 0 : v }))
                                setSellError(prev => ({ ...prev, [trade.id]: '' }))
                              }}
                            />
                            {sellError[trade.id] && (
                              <p className="text-xs text-red-600 mt-1">{sellError[trade.id]}</p>
                            )}
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <button
                              onClick={() => sellStock(trade)}
                              disabled={!sellQty[trade.id] || sellQty[trade.id] <= 0}
                              className="bg-red-600 text-white px-4 py-1 rounded
                                         hover:bg-red-700 transition
                                         disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
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

            {/* ── COUNTDOWN ── */}
            <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow">
              Next price update in <strong>{secondsLeft}s</strong>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
