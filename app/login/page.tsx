'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    setLoading(false)

    if (!res.ok) {
      alert('Invalid credentials')
      return
    }

    const data = await res.json()
    const token: string | undefined = data.token

    if (!token) {
      alert('Login failed')
      return
    }

    if (rememberMe) {
      localStorage.setItem('token', token)
    } else {
      sessionStorage.setItem('token', token)
    }

    router.push('/dashboard')
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
            Welcome back
          </h1>

          <p className="text-gray-600 text-center text-sm">
            Log in to continue trading with virtual money.
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">

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

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 
                         px-4 py-3 text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-black"
            />

            {/* Remember Me */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Remember me</span>

              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                  ${rememberMe ? 'bg-black' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition
                    ${rememberMe ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-xl 
                         font-semibold text-lg
                         hover:bg-gray-900 active:scale-95 transition
                         disabled:bg-gray-400"
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-sm text-gray-500 text-center">
            Don’t have an account?{' '}
            <button
              onClick={() => router.push('/register')}
              className="text-black font-medium hover:underline"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
