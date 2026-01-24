import { NextResponse } from 'next/server'
export const runtime = 'nodejs'

import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  const { tradeId, symbol, quantity, price, type, token } = await req.json()
  const payload: any = jwt.verify(token, process.env.JWT_SECRET!)

  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  })

  if (!user) {
    return new Response('User not found', { status: 404 })
  }

  const userId = user.id

  // 🟢 BUY
  if (type === 'BUY') {
  const existingTrade = await prisma.trade.findFirst({
    where: {
      userId,
      symbol,
      type: 'BUY',
    },
  })

  if (existingTrade) {
    await prisma.trade.update({
      where: { id: existingTrade.id },
      data: {
        quantity: existingTrade.quantity + quantity,
        price: existingTrade.price + price,
      },
    })
  } else {
    await prisma.trade.create({
      data: {
        userId,
        symbol,
        quantity,
        price,
        type: 'BUY',
      },
    })
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      balance: {
        decrement: price,
      },
    },
  })

  return NextResponse.json({ success: true })
}



  // 🔴 SELL
  if (type === 'SELL') {
    const buyTrade = await prisma.trade.findUnique({
      where: { id: tradeId }
    })

    if (!buyTrade || buyTrade.quantity < quantity) {
      return new Response('Invalid sell quantity', { status: 400 })
    }

    const pricePerShare = buyTrade.price / buyTrade.quantity
    const sellValue = pricePerShare * quantity
    const remainingQty = buyTrade.quantity - quantity
    const remainingValue = pricePerShare * remainingQty

    await prisma.$transaction([
      remainingQty === 0
        ? prisma.trade.delete({ where: { id: buyTrade.id } })
        : prisma.trade.update({
            where: { id: buyTrade.id },
            data: {
              quantity: remainingQty,
              price: remainingValue
            }
          }),

      prisma.trade.create({
        data: {
          symbol,
          quantity,
          price: sellValue,
          type: 'SELL',
          userId: user.id
        }
      }),

      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: user.balance + sellValue
        }
      })
    ])

    return Response.json({ success: true })
  }

  return new Response('Invalid type', { status: 400 })
}
