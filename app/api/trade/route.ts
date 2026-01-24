import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, symbol, quantity, price, type, tradeId } = body

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { userId: number }

    if (type === 'BUY') {
      await prisma.trade.create({
        data: {
          symbol,
          quantity,
          price,
          type: 'BUY',
          userId: decoded.userId
        }
      })

      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          balance: {
            decrement: price
          }
        }
      })
    }

    if (type === 'SELL') {
      if (!tradeId) {
        return NextResponse.json(
          { error: 'Missing tradeId' },
          { status: 400 }
        )
      }

      const trade = await prisma.trade.findUnique({
        where: { id: tradeId }
      })

      if (!trade || trade.quantity < quantity) {
        return NextResponse.json(
          { error: 'Invalid sell quantity' },
          { status: 400 }
        )
      }

      await prisma.trade.update({
        where: { id: tradeId },
        data: {
          quantity: trade.quantity - quantity
        }
      })

      const livePricePerShare = trade.price / trade.quantity

      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          balance: {
            increment: livePricePerShare * quantity
          }
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('TRADE ROUTE ERROR:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
