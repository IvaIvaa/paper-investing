export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query')

  if (!query || query.length < 1) {
    return Response.json([])
  }

  const res = await fetch(
    `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(
      query
    )}&active=true&limit=10&apiKey=${process.env.POLYGON_API_KEY}`
  )

  const data = await res.json()

  const results =
    data?.results?.map((t: any) => ({
      symbol: t.ticker,
      name: t.name,
    })) ?? []

  return Response.json(results)
}
