export const runtime = 'nodejs'

import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  const { token } = await req.json()
  const payload: any = jwt.verify(token, process.env.JWT_SECRET!)

  const trades = await prisma.trade.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: 'desc' }
  })

  return Response.json(trades)
}
