import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, symbol, quantity, price, currentPrice, type, tradeId } = body

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded: { userId: number }
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

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

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be a positive whole number' },
          { status: 400 }
        )
      }

      // ✅ Use a transaction to prevent race conditions on balance
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: decoded.userId }
        })

        if (!user || user.balance < price) {
          throw new Error('Insufficient balance')
        }

        // 🔹 Check if position already exists
        const existingTrade = await tx.trade.findFirst({
          where: {
            userId: decoded.userId,
            symbol,
            type: 'BUY'
          }
        })

        if (existingTrade) {
          // 🔁 Merge position (totalCost accumulates)
          await tx.trade.update({
            where: { id: existingTrade.id },
            data: {
              quantity: existingTrade.quantity + quantity,
              price: existingTrade.price + price
            }
          })
        } else {
          // ➕ Create new position
          await tx.trade.create({
            data: {
              userId: decoded.userId,
              symbol,
              quantity,
              price,   // stored as totalCost
              type: 'BUY'
            }
          })
        }

        // 💰 Deduct balance
        await tx.user.update({
          where: { id: decoded.userId },
          data: {
            balance: {
              decrement: price
            }
          }
        })
      }).catch((err: Error) => {
        if (err.message === 'Insufficient balance') {
          throw { status: 400, message: 'Insufficient balance' }
        }
        throw err
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

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be a positive whole number' },
          { status: 400 }
        )
      }

      // ✅ Use a transaction to prevent race conditions
      await prisma.$transaction(async (tx) => {
        const trade = await tx.trade.findUnique({
          where: { id: tradeId }
        })

        if (!trade || trade.userId !== decoded.userId) {
          throw { status: 404, message: 'Trade not found' }
        }

        if (trade.quantity < quantity) {
          throw { status: 400, message: 'Invalid sell quantity' }
        }

        // ✅ Use CURRENT MARKET PRICE for sell proceeds, not avg buy price
        // Falls back to avg buy price only if currentPrice wasn't provided
        const pricePerShare =
          typeof currentPrice === 'number' && currentPrice > 0
            ? currentPrice
            : trade.price / trade.quantity

        const sellValue = pricePerShare * quantity

        // 🔥 SELL ALL → DELETE TRADE
        if (trade.quantity === quantity) {
          await tx.trade.delete({
            where: { id: tradeId }
          })
        } else {
          // 🔽 Partial sell — reduce quantity and totalCost proportionally
          const costPerShare = trade.price / trade.quantity
          await tx.trade.update({
            where: { id: tradeId },
            data: {
              quantity: trade.quantity - quantity,
              price: trade.price - costPerShare * quantity
            }
          })
        }

        // 💰 Return cash at current market price
        await tx.user.update({
          where: { id: decoded.userId },
          data: {
            balance: {
              increment: sellValue
            }
          }
        })
      }).catch((err: { status?: number; message?: string } | Error) => {
        const typed = err as { status?: number; message?: string }
        if (typed.status) throw err
        throw err
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const typed = err as { status?: number; message?: string }
    if (typed?.status && typed?.message) {
      return NextResponse.json({ error: typed.message }, { status: typed.status })
    }
    console.error('TRADE ROUTE ERROR:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
