'use client'

import { useEffect, useState } from 'react'

const ENERGY_KEY     = 'playerEnergy'
const XP_KEY         = 'playerXP'
const SKILLS_KEY     = 'playerSkills'
const BONUS_SP_KEY   = 'playerBonusSP'
const JOB_KEY        = 'playerJobId'
const BALANCE_KEY    = 'playerBalance'
const PROPERTIES_KEY = 'playerProperties'
const MONTH_KEY      = 'playerMonth'
const RNG_KEY        = 'playerRngSeed'
const STOCKS_KEY     = 'playerStocks'
const WEEK_KEY       = 'playerWeek'
const NEWS_KEY       = 'playerNews'
const HISTORY_KEY    = 'playerPriceHistory'
const HOLDINGS_KEY   = 'playerHoldings'
const PENDING_KEY    = 'playerPendingWeek'

// ---------- TYPES ----------
export type Skills = {
  marketKnowledge: number
  riskManagement: number
  efficiency: number
  longTerm: number
}

const EMPTY_SKILLS: Skills = {
  marketKnowledge: 0,
  riskManagement: 0,
  efficiency: 0,
  longTerm: 0,
}

type OwnedProperty = {
  id: string
  location: string
  price: number
  lastPrice: number
  rent: number
  basePrice: number
}

type OwnedStock = {
  ticker: string
  price: number
  lastPrice: number
}

export type NewsItem = {
  headline: string
  body: string
  sentiment: 'positive' | 'negative' | 'neutral'
  ticker: string
  week: number
}

export type StockHolding = {
  ticker: string
  quantity: number
  totalCost: number   // sum of purchase prices for avg calc
}

// Pending week: news shown, prices not yet moved
type PendingWeek = {
  posTicker: string
  negTicker: string
  targetWeek: number
}

// ---------- NEWS TEMPLATES ----------
const NEWS_POS = [
  { h: '{ticker} surges on strong earnings beat',        b: 'Quarterly results exceeded analyst expectations, sending shares sharply higher.' },
  { h: 'Analysts raise {ticker} price target',           b: 'Bullish outlook follows robust demand and improving profit margins.' },
  { h: '{ticker} lands major government contract',       b: 'The landmark deal is expected to boost revenue significantly over the next year.' },
  { h: '{ticker} reports record-breaking revenue',       b: 'Management cites strong consumer demand and operational efficiency gains.' },
  { h: 'Institutional investors increase stake in {ticker}', b: 'Large funds signal high confidence in long-term growth potential.' },
  { h: '{ticker} announces a surprise share buyback',    b: 'The company plans to repurchase 10% of outstanding shares, boosting investor sentiment.' },
]

const NEWS_NEG = [
  { h: '{ticker} misses earnings by wide margin',        b: 'Revenue shortfall raises concerns about slowing demand and rising costs.' },
  { h: 'Regulatory probe targets {ticker}',              b: 'Investigators scrutinising business practices weigh heavily on sentiment.' },
  { h: '{ticker} cuts full-year guidance',               b: 'Management cites supply chain disruptions and rising input costs.' },
  { h: 'CEO of {ticker} resigns unexpectedly',           b: 'Leadership uncertainty sparks a sell-off among institutional holders.' },
  { h: '{ticker} loses key customer contract',           b: 'The loss represents a meaningful share of annual recurring revenue.' },
  { h: '{ticker} faces major product recall',            b: 'Safety concerns force the company to halt sales of its flagship product line.' },
]

const NEWS_NEU = [
  { h: 'Markets mixed as investors digest economic data', b: 'Inflation figures came in line with expectations; no major surprises either way.' },
  { h: 'Central bank holds rates steady',                 b: 'Policy unchanged as policymakers continue to monitor labour market conditions.' },
  { h: 'Global markets trade sideways amid uncertainty',  b: 'Mixed signals from major economies keep traders in a cautious mood.' },
  { h: 'Commodity prices stabilise after volatile week',  b: 'Oil and metals settle as supply concerns ease slightly.' },
  { h: 'Investors await key earnings from major sectors', b: 'Market sentiment remains neutral ahead of important company reports.' },
  { h: 'Trading volumes light ahead of holiday weekend',  b: 'Low liquidity conditions expected through the end of the week.' },
]

// ---------- SHARED STORES ----------
let energyStore = 100
let xpStore = 0
let bonusSPStore = 0
let jobStore: string | null = null
let balanceStore = 10000
let skillsStore: Skills = { ...EMPTY_SKILLS }
let ownedPropertiesStore: OwnedProperty[] = []
let monthStore = 0
let stockStore: OwnedStock[] = [
  { ticker: 'AI',   price: 312, lastPrice: 312 },
  { ticker: 'BNK',  price: 120, lastPrice: 120 },
  { ticker: 'NRG',  price: 58,  lastPrice: 58  },
  { ticker: 'TECH', price: 245, lastPrice: 245 },
  { ticker: 'MED',  price: 87,  lastPrice: 87  },
  { ticker: 'AUTO', price: 134, lastPrice: 134 },
  { ticker: 'RET',  price: 43,  lastPrice: 43  },
  { ticker: 'FOOD', price: 71,  lastPrice: 71  },
  { ticker: 'MIN',  price: 198, lastPrice: 198 },
  { ticker: 'FIN',  price: 156, lastPrice: 156 },
]
let weekStore = 0
let newsStore: NewsItem[] = []
let priceHistoryStore: Record<string, number[]> = {}
let holdingsStore: StockHolding[] = []
let pendingWeekStore: PendingWeek | null = null

const listeners = new Set<() => void>()
const notify = () => listeners.forEach(l => l())

// ---------- HELPERS ----------
function computeLevel(xp: number) {
  let level = 1
  while (xp >= 100 * (level + 1) * (level + 1)) level++
  return level
}

function computeBaseSkillPoints(xp: number) {
  return Math.floor(Math.sqrt(xp / 100))
}

function spentSkillPoints(skills: Skills) {
  return (
    skills.marketKnowledge +
    skills.riskManagement +
    skills.efficiency +
    skills.longTerm
  )
}

function getOrCreateSeed() {
  let seed = localStorage.getItem(RNG_KEY)
  if (!seed) {
    seed = String(Math.floor(Math.random() * 1_000_000_000))
    localStorage.setItem(RNG_KEY, seed)
  }
  return Number(seed)
}

function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

type MarketState = 'normal' | 'boom' | 'crash'

function rollMarketState(seed: number, month: number): MarketState {
  const r = seededRandom(seed + month * 9999)
  if (r < 0.03) return 'crash'
  if (r > 0.96) return 'boom'
  return 'normal'
}

function getMonthlyValueChange(
  seed: number,
  month: number,
  propertyId: string,
  market: MarketState
) {
  const idHash = propertyId.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  const r = seededRandom(seed + month * 1000 + idHash)
  let change = (r - 0.5) * 0.01
  if (market === 'boom')  change += 0.015
  if (market === 'crash') change -= 0.02
  return change
}

// ---------- STORE MUTATORS ----------
function setEnergyStore(v: number | ((prev: number) => number)) {
  const next = typeof v === 'function' ? v(energyStore) : v
  energyStore = Math.max(0, Math.min(100, next))
  localStorage.setItem(ENERGY_KEY, String(energyStore))
  notify()
}

function addXPStore(v: number) {
  xpStore = Math.max(0, xpStore + v)
  localStorage.setItem(XP_KEY, String(xpStore))
  notify()
}

function setJobStore(id: string | null) {
  jobStore = id
  id ? localStorage.setItem(JOB_KEY, id) : localStorage.removeItem(JOB_KEY)
  notify()
}

function setBalanceStore(v: number) {
  balanceStore = Math.max(0, v)
  localStorage.setItem(BALANCE_KEY, String(balanceStore))
  notify()
}

function buyPropertyStore(id: string, location: string, price: number, rent: number) {
  if (ownedPropertiesStore.some(p => p.id === id)) return false
  if (balanceStore < price) return false
  balanceStore -= price
  ownedPropertiesStore.push({ id, location, price, lastPrice: price, basePrice: price, rent })
  localStorage.setItem(BALANCE_KEY, String(balanceStore))
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(ownedPropertiesStore))
  notify()
  return true
}

function sellPropertyStore(id: string) {
  const index = ownedPropertiesStore.findIndex(p => p.id === id)
  if (index === -1) return false
  const property = ownedPropertiesStore[index]
  const sellPrice = Math.floor(property.price * 0.9)
  balanceStore += sellPrice
  ownedPropertiesStore.splice(index, 1)
  localStorage.setItem(BALANCE_KEY, String(balanceStore))
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(ownedPropertiesStore))
  notify()
  return true
}

// ✅ BUY STOCK
function buyStockStore(ticker: string, quantity: number): boolean {
  const stock = stockStore.find(s => s.ticker === ticker)
  if (!stock) return false
  const totalCost = stock.price * quantity
  if (balanceStore < totalCost) return false

  balanceStore -= totalCost

  const existing = holdingsStore.find(h => h.ticker === ticker)
  if (existing) {
    existing.quantity += quantity
    existing.totalCost += totalCost
  } else {
    holdingsStore.push({ ticker, quantity, totalCost })
  }

  localStorage.setItem(BALANCE_KEY, String(balanceStore))
  localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdingsStore))
  notify()
  return true
}

// ✅ SELL STOCK
function sellStockStore(ticker: string, quantity: number): boolean {
  const holding = holdingsStore.find(h => h.ticker === ticker)
  if (!holding || holding.quantity < quantity) return false

  const stock = stockStore.find(s => s.ticker === ticker)
  if (!stock) return false

  const proceeds = stock.price * quantity
  balanceStore += proceeds

  if (holding.quantity === quantity) {
    holdingsStore = holdingsStore.filter(h => h.ticker !== ticker)
  } else {
    const avgCost = holding.totalCost / holding.quantity
    holding.quantity -= quantity
    holding.totalCost -= avgCost * quantity
  }

  localStorage.setItem(BALANCE_KEY, String(balanceStore))
  localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdingsStore))
  notify()
  return true
}

function advanceMonthStore() {
  const seed = getOrCreateSeed()
  monthStore += 1
  localStorage.setItem(MONTH_KEY, String(monthStore))

  // 1️⃣ RENT INCOME
  const rentIncome = ownedPropertiesStore.reduce((sum, p) => sum + p.rent, 0)
  balanceStore += rentIncome

  // 2️⃣ MARKET STATE
  const market = rollMarketState(seed, monthStore)

  // 3️⃣ VALUE CHANGE PER PROPERTY
  ownedPropertiesStore = ownedPropertiesStore.map(p => {
    const pct = getMonthlyValueChange(seed, monthStore, p.id, market)
    const newPrice = Math.max(
      Math.round(p.price * (1 + pct)),
      Math.round(p.basePrice * 0.5)
    )
    return { ...p, lastPrice: p.price, price: newPrice }
  })

  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(ownedPropertiesStore))
  localStorage.setItem(BALANCE_KEY, String(balanceStore))
  notify()
}

// ── STEP 1: Generate news preview (prices don't move yet) ──
function previewWeekStore() {
  const seed        = getOrCreateSeed()
  const targetWeek  = weekStore + 1
  const tickers     = stockStore.map(s => s.ticker)

  // Pick two different tickers
  const posIdx = Math.floor(seededRandom(seed + targetWeek * 444) * tickers.length)
  let   negIdx = Math.floor(seededRandom(seed + targetWeek * 555) * tickers.length)
  if (negIdx === posIdx) negIdx = (negIdx + 1) % tickers.length

  const posTicker = tickers[posIdx]
  const negTicker = tickers[negIdx]

  // Generate headlines
  const pTpl = NEWS_POS[Math.floor(seededRandom(seed + targetWeek * 111) * NEWS_POS.length)]
  const nTpl = NEWS_NEG[Math.floor(seededRandom(seed + targetWeek * 222) * NEWS_NEG.length)]
  const uTpl = NEWS_NEU[Math.floor(seededRandom(seed + targetWeek * 333) * NEWS_NEU.length)]

  newsStore = [
    {
      headline:  pTpl.h.replace(/\{ticker\}/g, posTicker),
      body:      pTpl.b.replace(/\{ticker\}/g, posTicker),
      sentiment: 'positive',
      ticker:    posTicker,
      week:      targetWeek,
    },
    {
      headline:  nTpl.h.replace(/\{ticker\}/g, negTicker),
      body:      nTpl.b.replace(/\{ticker\}/g, negTicker),
      sentiment: 'negative',
      ticker:    negTicker,
      week:      targetWeek,
    },
    {
      headline:  uTpl.h,
      body:      uTpl.b,
      sentiment: 'neutral',
      ticker:    'MARKET',
      week:      targetWeek,
    },
  ]

  // Save news + pending state (prices NOT moved yet)
  pendingWeekStore = { posTicker, negTicker, targetWeek }
  localStorage.setItem(NEWS_KEY,   JSON.stringify(newsStore))
  localStorage.setItem(PENDING_KEY, JSON.stringify(pendingWeekStore))
  notify()
}

// ── STEP 2: Apply prices after player has read news & traded ──
function advanceWeekStore() {
  if (!pendingWeekStore) return

  const seed = getOrCreateSeed()
  const { posTicker, negTicker, targetWeek } = pendingWeekStore

  weekStore = targetWeek
  localStorage.setItem(WEEK_KEY, String(weekStore))

  // Random movement for every stock
  stockStore = stockStore.map(s => {
    const r   = seededRandom(seed + weekStore * 13_337 + s.ticker.charCodeAt(0))
    const pct = (r - 0.5) * 0.06   // -3% to +3%
    let newPrice = Math.max(1, Math.round(s.price * (1 + pct)))

    // Apply news effect on top
    if (s.ticker === posTicker) newPrice = Math.max(1, Math.round(newPrice * 1.05))
    if (s.ticker === negTicker) newPrice = Math.max(1, Math.round(newPrice * 0.95))

    return { ...s, lastPrice: s.price, price: newPrice }
  })

  // Record price history (max 52 weeks)
  stockStore.forEach(s => {
    if (!priceHistoryStore[s.ticker]) priceHistoryStore[s.ticker] = []
    priceHistoryStore[s.ticker].push(s.price)
    if (priceHistoryStore[s.ticker].length > 52) priceHistoryStore[s.ticker].shift()
  })

  // Clear pending — prices have been applied
  pendingWeekStore = null
  localStorage.removeItem(PENDING_KEY)
  localStorage.setItem(STOCKS_KEY,  JSON.stringify(stockStore))
  localStorage.setItem(HISTORY_KEY, JSON.stringify(priceHistoryStore))
  notify()
}

function upgradeSkillStore(skill: keyof Skills) {
  const baseSP = computeBaseSkillPoints(xpStore)
  const totalSP = baseSP + bonusSPStore
  const spent = spentSkillPoints(skillsStore)
  if (spent >= totalSP) return
  skillsStore[skill] += 1
  localStorage.setItem(SKILLS_KEY, JSON.stringify(skillsStore))
  notify()
}

function propertyPctChange(p: OwnedProperty) {
  if (!p.lastPrice || p.lastPrice <= 0) return 0
  return ((p.price - p.lastPrice) / p.lastPrice) * 100
}

function portfolioPctChange(properties: OwnedProperty[]) {
  const prev = properties.reduce((s, p) => s + (p.lastPrice ?? p.price), 0)
  const curr = properties.reduce((s, p) => s + p.price, 0)
  if (prev <= 0) return 0
  return ((curr - prev) / prev) * 100
}

// ---------- HOOK ----------
export function usePlayer() {
  const [skills, setSkills]                     = useState<Skills>({ ...EMPTY_SKILLS })
  const [energy, setEnergy]                     = useState(energyStore)
  const [xp, setXP]                             = useState(xpStore)
  const [bonusSP, setBonusSP]                   = useState(bonusSPStore)
  const [balance, setBalance]                   = useState(balanceStore)
  const [currentJobId, setCurrentJobId]         = useState<string | null>(jobStore)
  const [ownedProperties, setOwnedProperties]   = useState<OwnedProperty[]>([])
  const [stocks, setStocks]                     = useState<OwnedStock[]>([])
  const [news, setNews]                         = useState<NewsItem[]>([])
  const [priceHistory, setPriceHistory]         = useState<Record<string, number[]>>({})
  const [holdings, setHoldings]                 = useState<StockHolding[]>([])
  const [pendingWeek, setPendingWeek]           = useState<PendingWeek | null>(null)

  useEffect(() => {
    // ── Load all state from localStorage ──
    energyStore   = Number(localStorage.getItem(ENERGY_KEY)   ?? 100)
    xpStore       = Number(localStorage.getItem(XP_KEY)       ?? 0)
    bonusSPStore  = Number(localStorage.getItem(BONUS_SP_KEY) ?? 0)
    balanceStore  = Number(localStorage.getItem(BALANCE_KEY)  ?? 10000)
    monthStore    = Number(localStorage.getItem(MONTH_KEY)    ?? 0)
    weekStore     = Number(localStorage.getItem(WEEK_KEY)     ?? 0)
    jobStore      = localStorage.getItem(JOB_KEY)

    const rawProps = localStorage.getItem(PROPERTIES_KEY)
    ownedPropertiesStore = rawProps
      ? JSON.parse(rawProps).map((p: OwnedProperty) => ({
          ...p,
          lastPrice: p.lastPrice ?? p.price,
          basePrice: p.basePrice ?? p.price,
        }))
      : []

    // Stocks — merge saved with defaults so new stocks appear
    try {
      const rawStocks = localStorage.getItem(STOCKS_KEY)
      if (rawStocks) {
        const saved: OwnedStock[] = JSON.parse(rawStocks)
        const savedTickers = new Set(saved.map(s => s.ticker))
        stockStore = [
          ...saved,
          ...stockStore.filter(s => !savedTickers.has(s.ticker)),
        ]
        localStorage.setItem(STOCKS_KEY, JSON.stringify(stockStore))
      }
    } catch { /* keep defaults */ }

    // News
    try {
      const rawNews = localStorage.getItem(NEWS_KEY)
      newsStore = rawNews ? JSON.parse(rawNews) : []
    } catch { newsStore = [] }

    // Price history — init missing tickers with current price
    try {
      const rawHistory = localStorage.getItem(HISTORY_KEY)
      priceHistoryStore = rawHistory ? JSON.parse(rawHistory) : {}
    } catch { priceHistoryStore = {} }
    stockStore.forEach(s => {
      if (!priceHistoryStore[s.ticker]) priceHistoryStore[s.ticker] = [s.price]
    })

    // Holdings
    try {
      const rawHoldings = localStorage.getItem(HOLDINGS_KEY)
      holdingsStore = rawHoldings ? JSON.parse(rawHoldings) : []
    } catch { holdingsStore = [] }

    // Pending week
    try {
      const rawPending = localStorage.getItem(PENDING_KEY)
      pendingWeekStore = rawPending ? JSON.parse(rawPending) : null
    } catch { pendingWeekStore = null }

    // ── Sync React state ──
    setEnergy(energyStore)
    setXP(xpStore)
    setSkills({ ...skillsStore })
    setBonusSP(bonusSPStore)
    setBalance(balanceStore)
    setCurrentJobId(jobStore)
    setOwnedProperties([...ownedPropertiesStore])
    setStocks([...stockStore])
    setNews([...newsStore])
    setPriceHistory({ ...priceHistoryStore })
    setHoldings([...holdingsStore])
    setPendingWeek(pendingWeekStore ? { ...pendingWeekStore } : null)

    const listener = () => {
      setEnergy(energyStore)
      setXP(xpStore)
      setSkills({ ...skillsStore })
      setBonusSP(bonusSPStore)
      setBalance(balanceStore)
      setCurrentJobId(jobStore)
      setOwnedProperties([...ownedPropertiesStore])
      setStocks([...stockStore])
      setNews([...newsStore])
      setPriceHistory({ ...priceHistoryStore })
      setHoldings([...holdingsStore])
      setPendingWeek(pendingWeekStore ? { ...pendingWeekStore } : null)
    }

    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const baseSP = computeBaseSkillPoints(xp)
  const totalSkillPoints = baseSP + bonusSP
  const availableSkillPoints = Math.max(0, Math.floor(totalSkillPoints - spentSkillPoints(skills)))

  return {
    getMonthlyRent:       () => ownedPropertiesStore.reduce((sum, p) => sum + p.rent, 0),
    getRealEstatePctChange: () => portfolioPctChange(ownedPropertiesStore),

    // data
    stocks,
    news,
    priceHistory,
    holdings,
    pendingWeek,
    energy,
    xp,
    level: computeLevel(xp),
    balance,
    currentJobId,
    ownedProperties,
    propertyPctChange,
    skills,
    totalSkillPoints,
    availableSkillPoints,

    // actions
    setEnergy:      setEnergyStore,
    addXP:          addXPStore,
    setCurrentJobId: setJobStore,
    addMoney:       (v: number) => setBalanceStore(balanceStore + v),
    spendMoney:     (v: number) => setBalanceStore(balanceStore - v),
    buyProperty:    buyPropertyStore,
    upgradeSkill:   upgradeSkillStore,
    sellProperty:   sellPropertyStore,
    advanceMonth:   advanceMonthStore,
    previewWeek:    previewWeekStore,    // Step 1: show news, don't move prices
    advanceWeek:    advanceWeekStore,    // Step 2: apply prices after player trades
    buyStock:       buyStockStore,
    sellStock:      sellStockStore,
  }
}
