'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex items-center justify-center 
                     bg-gradient-to-br from-[#0f0f0f] via-[#141414] to-black px-4">

      <div className="relative max-w-2xl w-full text-center">

        {/* Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 
                        blur-3xl opacity-30 rounded-3xl" />

        {/* Card */}
        <div className="relative bg-white/95 backdrop-blur rounded-3xl shadow-2xl 
                        p-12 space-y-8">

          {/* Badge */}
          <div className="inline-block px-4 py-1 rounded-full text-sm font-medium
                          bg-gray-100 text-gray-700">
            📈 Paper Gain • Real market data
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
            Learn the market.
            <br />
            <span className="text-transparent bg-clip-text 
                             bg-gradient-to-r from-green-500 to-blue-600">
              Risk nothing.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 leading-relaxed">
            Practice stock trading with <strong>real market prices</strong>,  
            build strategies, and grow confidence — without using real money.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-4 rounded-xl bg-black text-white text-lg font-semibold
                         hover:bg-gray-900 active:scale-95 transition"
            >
              Get Started Free
            </button>

            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 rounded-xl text-lg font-semibold
                         border border-gray-300 text-gray-700
                         hover:bg-gray-100 active:scale-95 transition"
            >
              Log In
            </button>
          </div>

          {/* Footer note */}
          <p className="text-sm text-gray-400">
            No credit card • Built with real-time data
          </p>
        </div>
      </div>
    </main>
  )
}
