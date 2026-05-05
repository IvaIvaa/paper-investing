export type Stock = {
  symbol: string
  name: string
  price: number
}

let stocks: Stock[] = [
  { symbol: 'APL', name: 'Appleton', price: 180 },
  { symbol: 'TSL', name: 'Teslix', price: 245 },
  { symbol: 'AMZ', name: 'Amazex', price: 130 },
]

// simple fake market movement
export function tickMarket() {
  stocks = stocks.map(stock => {
    const change = (Math.random() - 0.5) * 2 // -1% to +1%
    return {
      ...stock,
      price: Math.max(1, +(stock.price * (1 + change / 100)).toFixed(2)),
    }
  })
}

export function getStocks() {
  return stocks
}

export function searchStocks(query: string) {
  return stocks.filter(s =>
    s.symbol.toLowerCase().includes(query.toLowerCase()) ||
    s.name.toLowerCase().includes(query.toLowerCase())
  )
}
