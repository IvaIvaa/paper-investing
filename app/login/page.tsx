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
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <form
  onSubmit={handleLogin}
  className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl space-y-5">

        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Login
        </h1>


        <input 
          type="email"
          placeholder="Email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          required
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          required
          onChange={e => setPassword(e.target.value)}
        />
        <div className="flex items-center justify-between">
  <span className="text-sm text-gray-700">
    Remember me
  </span>

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
  className="w-full mt-2 rounded-lg bg-black py-2 text-white font-semibold
             hover:bg-gray-900 transition focus:outline-none focus:ring-2 focus:ring-black"
>
  Login
</button>


      </form>
      </div>
    </main>
  )
}
