export const runtime = 'nodejs'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return new Response('Invalid', { status: 401 })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return new Response('Invalid', { status: 401 })

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!
  )

  return Response.json({ token })
}
