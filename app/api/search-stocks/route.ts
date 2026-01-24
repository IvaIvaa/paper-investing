import { NextResponse } from 'next/server'

const CACHE = new Map<string, any>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.toUpperCase()

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  // ✅ cache hit
  if (CACHE.has(query)) {
    return NextResponse.json(CACHE.get(query))
  }

  const res = await fetch(
    `https://api.polygon.io/v3/reference/tickers?search=${query}&limit=5&apiKey=${process.env.POLYGON_API_KEY}`
  )

  const data = await res.json()

  const results =
    data?.results?.map((t: any) => ({
      symbol: t.ticker,
      name: t.name
    })) ?? []

  CACHE.set(query, results)
  setTimeout(() => CACHE.delete(query), CACHE_TTL)

  return NextResponse.json(results)
}
