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

    router.push('/login')
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleRegister} className="w-80 space-y-4">
        <h1 className="text-2xl font-bold">Create Account</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2"
          required
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2"
          required
          onChange={e => setPassword(e.target.value)}
        />

        <button className="w-full bg-black text-white py-2">
          Register
        </button>
      </form>
    </main>
  )
}
