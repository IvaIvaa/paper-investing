import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { symbols } = await req.json()

  const results: Record<string, number> = {}

  await Promise.all(
    symbols.map(async (sym: string) => {
      try {
        const res = await fetch(
          `https://api.polygon.io/v2/aggs/ticker/${sym}/prev?apiKey=${process.env.POLYGON_API_KEY}`
        )
        const data = await res.json()
        const price = data?.results?.[0]?.c
        if (typeof price === 'number') {
          results[sym] = price
        }
      } catch {}
    })
  )

  return NextResponse.json(results)
}
