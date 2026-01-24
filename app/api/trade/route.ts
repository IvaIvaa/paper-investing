import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, symbol, quantity, price, type, tradeId } = body

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { userId: number }

    // ======================
    // 🟢 BUY
    // ======================
    if (type === 'BUY') {
      if (!symbol || !quantity || !price) {
        return NextResponse.json(
          { error: 'Missing buy fields' },
          { status: 400 }
        )
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      })

      if (!user || user.balance < price) {
        return NextResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        )
      }

      // 🔹 Check if position already exists
      const existingTrade = await prisma.trade.findFirst({
        where: {
          userId: decoded.userId,
          symbol,
          type: 'BUY'
        }
      })

      if (existingTrade) {
        // 🔁 Merge position (avg price handled automatically)
        await prisma.trade.update({
          where: { id: existingTrade.id },
          data: {
            quantity: existingTrade.quantity + quantity,
            price: existingTrade.price + price
          }
        })
      } else {
        // ➕ Create new position
        await prisma.trade.create({
          data: {
            userId: decoded.userId,
            symbol,
            quantity,
            price,
            type: 'BUY'
          }
        })
      }

      // 💰 Deduct balance
      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          balance: {
            decrement: price
          }
        }
      })
    }

    // ======================
    // 🔴 SELL
    // ======================
    if (type === 'SELL') {
      if (!tradeId || !quantity) {
        return NextResponse.json(
          { error: 'Missing sell fields' },
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

      const pricePerShare = trade.price / trade.quantity
      const sellValue = pricePerShare * quantity

      // 🔥 SELL ALL → DELETE TRADE
      if (trade.quantity === quantity) {
        await prisma.trade.delete({
          where: { id: tradeId }
        })
      } else {
        // 🔽 Partial sell
        await prisma.trade.update({
          where: { id: tradeId },
          data: {
            quantity: trade.quantity - quantity,
            price: trade.price - sellValue
          }
        })
      }

      // 💰 Add cash back
      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          balance: {
            increment: sellValue
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
