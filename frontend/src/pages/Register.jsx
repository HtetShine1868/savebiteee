import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AtSign, KeyRound, ShoppingBasket, Store, User } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Field.jsx'
import { useAuth } from '../context/auth-context.js'
import { useToast } from '../context/toast-context.js'
import { useGoogleAuth } from '../hooks/useGoogleAuth.js'
import { cn } from '../lib/cn.js'

const ROLES = [
  {
    value: 'customer',
    icon: ShoppingBasket,
    title: 'I want to buy food',
    body: 'Discover discounted food nearby, chat with the AI, and reserve for pickup.',
  },
  {
    value: 'owner',
    icon: Store,
    title: 'I sell food',
    body: 'List surplus stock before it expires and manage walk-in reservations.',
  },
]

export default function Register() {
  const [searchParams] = useSearchParams()
  const { register, loginWithGoogle } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [role, setRole] = useState(searchParams.get('role') === 'owner' ? 'owner' : 'customer')
  const [form, setForm] = useState({ fullName: '', email: '', password: '', shopName: '', city: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const onSubmit = async (event) => {
    event.preventDefault()
    if (form.password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await register({
        role,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        city: form.city || null,
        shopName: role === 'owner' ? form.shopName : undefined,
      })
      notify({
        tone: 'success',
        title: 'Account created',
        description:
          role === 'owner'
            ? 'Finish your shop profile so customers can find you.'
            : 'Start browsing what needs rescuing today.',
      })
      navigate(role === 'owner' ? '/owner/shop' : '/app', { replace: true })
    } catch (requestError) {
      setError(
        requestError.isMissing
          ? 'The register endpoint is not live yet (POST /api/auth/register).'
          : requestError.message
      )
    } finally {
      setSubmitting(false)
    }
  }

  const google = useGoogleAuth(async (credential) => {
    try {
      const user = await loginWithGoogle({ idToken: credential, role })
      navigate(user?.role === 'owner' ? '/owner' : '/app', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    }
  })

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Choose how you want to use Food Waste Solver. You can always add a shop later."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <fieldset className="space-y-3">
        <legend className="sr-only">Account type</legend>
        {ROLES.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-3xl p-4 ring-1 transition',
              role === option.value
                ? 'bg-brand-50 ring-2 ring-brand-500'
                : 'bg-surface ring-line hover:ring-brand-200'
            )}
          >
            <input
              type="radio"
              name="role"
              value={option.value}
              checked={role === option.value}
              onChange={() => setRole(option.value)}
              className="sr-only"
            />
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-2xl',
                role === option.value ? 'bg-brand-600 text-white' : 'bg-canvas text-muted'
              )}
            >
              <option.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-sm font-bold text-ink">{option.title}</span>
              <span className="mt-0.5 block text-xs text-muted">{option.body}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          label="Full name"
          icon={User}
          required
          autoComplete="name"
          placeholder="Aye Chan"
          value={form.fullName}
          onChange={update('fullName')}
        />
        {role === 'owner' ? (
          <Input
            label="Shop name"
            icon={Store}
            required
            placeholder="Sweet Crumb Bakery"
            value={form.shopName}
            onChange={update('shopName')}
          />
        ) : null}
        <Input
          label="Email"
          type="email"
          icon={AtSign}
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={update('email')}
        />
        <Input
          label="Password"
          type="password"
          icon={KeyRound}
          required
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use 8 characters or more."
          value={form.password}
          onChange={update('password')}
        />
        <Input
          label="City"
          hint="Optional — helps us show food close to you."
          placeholder="Yangon"
          value={form.city}
          onChange={update('city')}
        />

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {role === 'owner' ? 'Create shop account' : 'Create account'}
        </Button>
      </form>

      {google.enabled ? (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="flex justify-center">
            <div ref={google.buttonRef} />
          </div>
        </>
      ) : null}
    </AuthLayout>
  )
}
