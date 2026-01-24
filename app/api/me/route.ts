export const runtime = 'nodejs'

import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  const { token } = await req.json()
  const payload: any = jwt.verify(token, process.env.JWT_SECRET!)

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { balance: true }
  })

  return Response.json(user)
}
