import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AtSign, KeyRound } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Field.jsx'
import { useAuth } from '../context/auth-context.js'
import { useToast } from '../context/toast-context.js'
import { useGoogleAuth } from '../hooks/useGoogleAuth.js'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from

  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const landing = (user) => redirectTo ?? (user?.role === 'owner' ? '/owner' : '/app')

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const user = await login(form)
      notify({ tone: 'success', title: `Welcome back${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}` })
      navigate(landing(user), { replace: true })
    } catch (requestError) {
      setError(
        requestError.isMissing
          ? 'The login endpoint is not live yet (POST /api/auth/login).'
          : requestError.message
      )
    } finally {
      setSubmitting(false)
    }
  }

  const google = useGoogleAuth(async (credential) => {
    try {
      const user = await loginWithGoogle({ idToken: credential })
      navigate(landing(user), { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    }
  })

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to reserve rescue deals and keep an eye on your favourite shops."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          icon={AtSign}
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <Input
          label="Password"
          type="password"
          icon={KeyRound}
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {google.enabled ? (
        <div className="flex justify-center">
          <div ref={google.buttonRef} />
        </div>
      ) : (
        <p className="rounded-2xl bg-canvas px-4 py-3 text-center text-xs text-muted ring-1 ring-line">
          Google sign-in appears here once <code className="font-semibold">VITE_GOOGLE_CLIENT_ID</code> is
          set in <code className="font-semibold">frontend/.env</code>.
        </p>
      )}
    </AuthLayout>
  )
}
