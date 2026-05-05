'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // ✅ Client-side password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.')
        return
      }

      router.push('/login')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center
                     bg-gradient-to-br from-[#0f0f0f] via-[#141414] to-black px-4">

      <div className="relative max-w-md w-full">

        {/* Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r
                        from-green-500/20 to-blue-500/20
                        blur-3xl opacity-30 rounded-3xl" />

        {/* Card */}
        <div className="relative bg-white/95 backdrop-blur
                        rounded-3xl shadow-2xl p-10 space-y-6">

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-gray-900 text-center">
            Create your account
          </h1>

          <p className="text-gray-600 text-center text-sm">
            Start trading with virtual money using real market prices.
          </p>

          {/* Inline error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300
                         px-4 py-3 text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-black"
            />

            <div>
              <input
                type="password"
                placeholder="Password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300
                           px-4 py-3 text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="mt-1 text-xs text-gray-400">Minimum 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-xl
                         font-semibold text-lg
                         hover:bg-gray-900 active:scale-95 transition
                         disabled:bg-gray-400"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-sm text-gray-500 text-center">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-black font-medium hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
