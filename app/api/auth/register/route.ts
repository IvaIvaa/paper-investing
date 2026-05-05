export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      )
    }

    // ✅ Server-side password validation
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    // 🔍 Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // 🔐 Hash password
    const hashed = await bcrypt.hash(password, 10)

    // 🧑 Create user with starting balance
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        balance: 10000
      }
    })

    return NextResponse.json({
      id: user.id,
      email: user.email
    })
  } catch (err) {
    console.error('REGISTER ERROR:', err)

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
