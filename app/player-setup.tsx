'use client'
import { useState } from 'react'

export default function PlayerSetup({
  onComplete,
}: {
  onComplete: (player: { name: string; sex: 'male' | 'female' | 'other' }) => void
}) {
  const [name, setName] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('')

  const canStart = name.trim().length > 0 && sex !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#161b26] border border-[#1f2430] p-6 text-gray-200 shadow-2xl">

        {/* TITLE */}
        <h2 className="text-xl font-bold mb-4 text-white">
          Create your trader
        </h2>

        {/* NAME INPUT */}
        <input
          className="
            w-full
            rounded-xl
            bg-[#0f1115]
            border border-[#1f2430]
            px-4 py-3
            text-sm text-gray-100
            placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            mb-4
          "
          placeholder="Trader name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        {/* SEX BUTTONS */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {(['male', 'female', 'other'] as const).map(option => {
            const active = sex === option

            return (
              <button
                key={option}
                type="button"
                onClick={() => setSex(option)}
                className={`
                  rounded-xl
                  py-2.5
                  text-sm font-medium
                  border
                  transition
                  ${
                    active
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-[#0f1115] text-gray-300 border-[#1f2430] hover:bg-[#1a1f2e]'
                  }
                `}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            )
          })}
        </div>

        {/* START BUTTON */}
        <button
          disabled={!canStart}
          onClick={() => {
  if (!sex) return
  onComplete({ name: name.trim(), sex })
}}

          className={`
            w-full
            rounded-xl
            py-3
            text-sm font-semibold
            transition
            ${
              canStart
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-black/40 hover:brightness-110 active:scale-95'
                : 'bg-[#2a2f3a] text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Start Trading
        </button>

      </div>
    </div>
  )
}
