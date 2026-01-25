'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token')

    if (token) {
      router.replace('/dashboard')
    } else {
      setChecked(true)
    }
  }, [router])

  // Prevent flicker while checking auth
  if (!checked) return null

  return (
    <main className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <h1 className="text-4xl font-bold mb-4">
        Paper Investing Platform
      </h1>

      <p className="text-gray-600 mb-6 text-center max-w-md">
        Practice trading stocks with real market data — no real money.
      </p>

      <div className="flex gap-4">
        <a
          href="/register"
          className="px-6 py-2 bg-black text-white rounded"
        >
          Create Account
        </a>

        <a
          href="/login"
          className="px-6 py-2 border rounded"
        >
          Login
        </a>
      </div>
  </div>
    </main>

  )
}
