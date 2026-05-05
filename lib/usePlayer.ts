'use client'

import { useEffect, useState } from 'react'

const ENERGY_KEY = 'playerEnergy'
const XP_KEY = 'playerXP'
const SKILLS_KEY = 'playerSkills'
const BONUS_SP_KEY = 'playerBonusSP'
const JOB_KEY = 'playerJobId'
const BALANCE_KEY = 'playerBalance'
const PROPERTIES_KEY = 'playerProperties'
const MONTH_KEY = 'playerMonth'
const RNG_KEY = 'playerRngSeed'
const STOCKS_KEY = 'playerStocks'
const WEEK_KEY = 'playerWeek'




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
  price: number        // current value
  lastPrice: number   // previous month value (NEW)
  rent: number
  basePrice: number
}

type OwnedStock = {
  ticker: string
  price: number
  lastPrice: number
}



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
  { ticker: 'AI', price: 312, lastPrice: 312 },
  { ticker: 'BNK', price: 120, lastPrice: 120 },
  { ticker: 'NRG', price: 58, lastPrice: 58 },
]
let weekStore = 0



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

  if (r < 0.03) return 'crash'   // 3%
  if (r > 0.96) return 'boom'    // 4%
  return 'normal'                // 93%
}

function getMonthlyValueChange(
  seed: number,
  month: number,
  propertyId: string,
  market: MarketState
) {
  const idHash = propertyId
    .split('')
    .reduce((s, c) => s + c.charCodeAt(0), 0)

  const r = seededRandom(seed + month * 1000 + idHash)

  let change = (r - 0.5) * 0.01 // ~ -0.5% to +0.5%

  if (market === 'boom') change += 0.015   // +1.5%
  if (market === 'crash') change -= 0.02   // -2%

  return change
}



// ---------- STORE MUTATORS ----------
function setEnergyStore(
  v: number | ((prev: number) => number)
) {
  const next =
    typeof v === 'function' ? v(energyStore) : v

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

function buyPropertyStore(
  id: string,
  location: string,
  price: number,
  rent: number
) {

  if (ownedPropertiesStore.some(p => p.id === id)) return false
  if (balanceStore < price) return false

  balanceStore -= price
 ownedPropertiesStore.push({
  id,
  location,
  price,
  lastPrice: price,   // NEW
  basePrice: price,
  rent,
})



  localStorage.setItem(BALANCE_KEY, String(balanceStore))
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(ownedPropertiesStore))
  notify()
  return true
}

function advanceMonthStore() {
  const seed = getOrCreateSeed()

  // increment month
  monthStore += 1
  localStorage.setItem(MONTH_KEY, String(monthStore))

  // 1️⃣ RENT INCOME
  const rentIncome = ownedPropertiesStore.reduce(
    (sum, p) => sum + p.rent,
    0
  )
  balanceStore += rentIncome

  // 2️⃣ MARKET STATE (rare boom/crash)
  const market = rollMarketState(seed, monthStore)

  // 3️⃣ VALUE CHANGE PER PROPERTY
  ownedPropertiesStore = ownedPropertiesStore.map(p => {
    const pct = getMonthlyValueChange(
      seed,
      monthStore,
      p.id,
      market
    )

    const newPrice = Math.max(
      Math.round(p.price * (1 + pct)),
      Math.round(p.basePrice * 0.5) // hard floor
    )

    return {
      ...p,
      lastPrice: p.price,   // store previous value
      price: newPrice,
    }
  })

  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(ownedPropertiesStore))
  localStorage.setItem(BALANCE_KEY, String(balanceStore))

  notify()
}
function advanceWeekStore() {
  const seed = getOrCreateSeed()

  // ✅ increment week
  weekStore += 1
  localStorage.setItem(WEEK_KEY, String(weekStore))

  stockStore = stockStore.map(s => {
    const r = seededRandom(
      seed +
      weekStore * 13_337 +        // 🔥 THIS WAS THE BUG
      s.ticker.charCodeAt(0)
    )

    // weekly change: -3% to +3%
    const pct = (r - 0.5) * 0.06

    return {
      ...s,
      lastPrice: s.price,
      price: Math.max(1, Math.round(s.price * (1 + pct))),
    }
  })

  localStorage.setItem(STOCKS_KEY, JSON.stringify(stockStore))
  notify()
}




function sellPropertyStore(id: string) {
  const index = ownedPropertiesStore.findIndex(p => p.id === id)
  if (index === -1) return false

  const property = ownedPropertiesStore[index]

  // sell for 90% of original price
  const sellPrice = Math.floor(property.price * 0.9)

  balanceStore += sellPrice
  ownedPropertiesStore.splice(index, 1)

  localStorage.setItem(BALANCE_KEY, String(balanceStore))
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(ownedPropertiesStore))
  notify()

  return true
}

// ---------- SKILL UPGRADE ----------
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
  const prev = properties.reduce(
    (s, p) => s + (p.lastPrice ?? p.price),
    0
  )
  const curr = properties.reduce((s, p) => s + p.price, 0)

  if (prev <= 0) return 0
  return ((curr - prev) / prev) * 100
}




// ---------- HOOK ----------
export function usePlayer() {
  // ✅ NEVER UNDEFINED
  const [skills, setSkills] = useState<Skills>({ ...EMPTY_SKILLS })
  const [energy, setEnergy] = useState(energyStore)
  const [xp, setXP] = useState(xpStore)
  const [bonusSP, setBonusSP] = useState(bonusSPStore)
  const [balance, setBalance] = useState(balanceStore)
  const [currentJobId, setCurrentJobId] = useState<string | null>(jobStore)
  const [ownedProperties, setOwnedProperties] = useState<OwnedProperty[]>([])
  const [stocks, setStocks] = useState<OwnedStock[]>([])



  useEffect(() => {
  // load from localStorage
  energyStore = Number(localStorage.getItem(ENERGY_KEY) ?? 100)
  xpStore = Number(localStorage.getItem(XP_KEY) ?? 0)
  bonusSPStore = Number(localStorage.getItem(BONUS_SP_KEY) ?? 0)
  balanceStore = Number(localStorage.getItem(BALANCE_KEY) ?? 10000)
  monthStore = Number(localStorage.getItem(MONTH_KEY) ?? 0)
  weekStore = Number(localStorage.getItem(WEEK_KEY) ?? 0)


  jobStore = localStorage.getItem(JOB_KEY)

const rawProps = localStorage.getItem(PROPERTIES_KEY)
ownedPropertiesStore = rawProps
  ? JSON.parse(rawProps).map((p: any) => ({
      ...p,
      lastPrice: p.lastPrice ?? p.price, // ✅ FIX
      basePrice: p.basePrice ?? p.price, // safety
    }))
  : []

  try {
  const rawStocks = localStorage.getItem(STOCKS_KEY)
  stockStore = rawStocks ? JSON.parse(rawStocks) : stockStore
  setStocks([...stockStore])
} catch {
  // keep defaults
}



  // PROPERTIES



  // sync state
  setEnergy(energyStore)
  setXP(xpStore)
  setSkills({ ...skillsStore })
  setBonusSP(bonusSPStore)
  setBalance(balanceStore)
  setCurrentJobId(jobStore)
  setOwnedProperties([...ownedPropertiesStore])
  setStocks([...stockStore])






  const listener = () => {
    setEnergy(energyStore)
    setXP(xpStore)
    setSkills({ ...skillsStore })
    setBonusSP(bonusSPStore)
    setBalance(balanceStore)
    setCurrentJobId(jobStore)
    setOwnedProperties([...ownedPropertiesStore])
    setStocks([...stockStore])
    

  }

  listeners.add(listener)

  // ✅ CLEANUP MUST RETURN VOID
  return () => {
    listeners.delete(listener)
  }
}, [])


  const baseSP = computeBaseSkillPoints(xp)
  const totalSkillPoints = baseSP + bonusSP
  const availableSkillPoints = Math.max(
  0,
  Math.floor(totalSkillPoints - spentSkillPoints(skills))
)

  
  
  return {
    getMonthlyRent: () =>
  ownedPropertiesStore.reduce((sum, p) => sum + p.rent, 0),
    getRealEstatePctChange: () =>
  portfolioPctChange(ownedPropertiesStore),


    // core
    stocks,
    energy,
    xp,
    level: computeLevel(xp),
    balance,
    currentJobId,
    ownedProperties,
    propertyPctChange,

    

    // skills
    skills,
    totalSkillPoints,
    availableSkillPoints,

    // actions
    setEnergy: setEnergyStore,
    addXP: addXPStore,
    setCurrentJobId: setJobStore,
    addMoney: (v: number) => setBalanceStore(balanceStore + v),
    spendMoney: (v: number) => setBalanceStore(balanceStore - v),
    buyProperty: buyPropertyStore,
    upgradeSkill: upgradeSkillStore,
    sellProperty: sellPropertyStore,
    advanceMonth: advanceMonthStore,
  advanceWeek: advanceWeekStore,
    
  }
}
