'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)


  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

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
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="w-80 space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>

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
        <div className="flex items-center gap-2 text-sm mb-4">
  <input
    type="checkbox"
    id="remember"
    checked={rememberMe}
    onChange={e => setRememberMe(e.target.checked)}
  />
  <label htmlFor="remember">Remember me</label>
</div>


        <button className="w-full bg-black text-white py-2">
          Login
        </button>
      </form>
    </main>
  )
}
