import { useEffect, useState } from 'react'

function StatusBadge({ ok, label, detail }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 text-left shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            ok
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {ok ? 'Connected' : 'Waiting'}
        </span>
      </div>
      <p className="mt-2 text-sm text-stone-700">{detail}</p>
    </div>
  )
}

function App() {
  const [api, setApi] = useState({ loading: true, ok: false, detail: 'Checking…' })

  useEffect(() => {
    fetch('/api/health')
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'API request failed')
        }
        setApi({
          loading: false,
          ok: true,
          detail: `${data.service} is running`,
        })
      })
      .catch(() => {
        setApi({
          loading: false,
          ok: false,
          detail: 'Start the backend with npm run dev in /backend',
        })
      })
  }, [])

  return (
    <div className="min-h-svh bg-stone-50 text-stone-900">
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold tracking-wide text-emerald-700 uppercase">
          Food Waste
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          React + Tailwind is ready
        </h1>
        <p className="mt-3 max-w-xl text-stone-600">
          Frontend is Vite, React, and Tailwind CSS. The API is Express and
          talks to Supabase once you add keys in <code className="rounded bg-stone-200 px-1.5 py-0.5 text-sm">backend/.env</code>.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <StatusBadge
            ok={api.ok}
            label="Express API"
            detail={api.loading ? 'Checking…' : api.detail}
          />
          <StatusBadge
            ok={false}
            label="Supabase"
            detail="Copy backend/.env.example to backend/.env and add your project URL and keys."
          />
        </div>
      </main>
    </div>
  )
}

export default App
