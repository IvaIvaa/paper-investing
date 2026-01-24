export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get('symbol')

  if (!symbol) {
    return new Response('Symbol required', { status: 400 })
  }

  const apiKey = process.env.POLYGON_API_KEY
  if (!apiKey) {
    return new Response('Polygon API key missing', { status: 500 })
  }

  // Get previous close (free tier compatible)
  const res = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKey}`,
    { cache: 'no-store' }
  )

  const data = await res.json()

  if (!data.results || data.results.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Price not available' }),
      { status: 404 }
    )
  }

  const price = data.results[0].c // close price

  return Response.json({
    symbol,
    price
  })
}
