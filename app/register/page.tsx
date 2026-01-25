'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      alert('Registration failed')
      return
    }

    const data = await res.json()
    const token: string | undefined = data.token

    if (!token) {
      alert('Registration failed')
      return
    }

    // Default: remember user after register
    localStorage.setItem('token', token)

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl space-y-5"
      >
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Create Account
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2
                     text-gray-900 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-black"
          required
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2
                     text-gray-900 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-black"
          required
          onChange={e => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-black py-2 text-white font-semibold
                     hover:bg-gray-900 transition
                     focus:outline-none focus:ring-2 focus:ring-black"
        >
          Create Account
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-black font-semibold hover:underline">
            Login
          </a>
        </p>
      </form>
    </main>
  )
}
