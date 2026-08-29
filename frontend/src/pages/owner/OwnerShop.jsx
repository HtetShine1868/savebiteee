import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AtSign,
  Compass,
  ImageIcon,
  MapPin,
  Phone,
  Save,
  Store,
} from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card } from '../../components/ui/Surface.jsx'
import { Chip, Input, Textarea } from '../../components/ui/Field.jsx'
import { ErrorState, Skeleton } from '../../components/ui/Feedback.jsx'
import { useToast } from '../../context/toast-context.js'
import { useSession } from '../../context/session-context.js'
import { useResource } from '../../hooks/useResource.js'
import { shopService } from '../../lib/services.js'
import { CATEGORIES } from '../../lib/promotions.js'
import { initials } from '../../lib/format.js'

const EMPTY = {
  name: '',
  description: '',
  profileImageUrl: '',
  coverImageUrl: '',
  address: '',
  city: '',
  latitude: '',
  longitude: '',
  contactPhone: '',
  contactEmail: '',
  categories: [],
  openingHours: { weekdays: '', weekends: '' },
}

export default function OwnerShop() {
  const { notify } = useToast()
  const { requestLocation } = useSession()
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [errors, setErrors] = useState({})

  const { data, loading, error, reload } = useResource((signal) => shopService.mine(signal), [])

  useEffect(() => {
    if (!data) return
    setForm({
      name: data.name ?? '',
      description: data.description ?? '',
      profileImageUrl: data.profileImageUrl ?? '',
      coverImageUrl: data.coverImageUrl ?? '',
      address: data.address ?? '',
      city: data.city ?? '',
      latitude: data.latitude ?? '',
      longitude: data.longitude ?? '',
      contactPhone: data.contactPhone ?? '',
      contactEmail: data.contactEmail ?? '',
      categories: data.categories ?? [],
      openingHours:
        data.openingHours && typeof data.openingHours === 'object'
          ? { weekdays: '', weekends: '', ...data.openingHours }
          : { weekdays: '', weekends: '' },
    })
  }, [data])

  const update = (field) => (event) => {
    const value = event?.target ? event.target.value : event
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const toggleCategory = (slug) =>
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(slug)
        ? current.categories.filter((item) => item !== slug)
        : [...current.categories, slug],
    }))

  const useMyLocation = async () => {
    const position = await requestLocation()
    if (!position) {
      notify({ tone: 'info', title: 'Location not shared', description: 'You can type coordinates instead.' })
      return
    }
    setForm((current) => ({
      ...current,
      latitude: position.latitude,
      longitude: position.longitude,
    }))
    notify({ tone: 'success', title: 'Coordinates filled in' })
  }

  const completeness = useMemo(() => {
    const checks = [
      Boolean(form.name),
      Boolean(form.description),
      Boolean(form.address),
      Boolean(form.city),
      Boolean(form.contactPhone || form.contactEmail),
      form.categories.length > 0,
      Boolean(form.profileImageUrl),
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [form])

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: 'Customers need a shop name.' })
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      await shopService.save(data?.id, form)
      notify({
        tone: 'success',
        title: data?.id ? 'Shop profile saved' : 'Shop created',
        description: data?.id ? undefined : 'You can publish your first promotion now.',
      })
      reload()
    } catch (requestError) {
      setSubmitError(requestError)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-96 rounded-4xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Shop profile</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            This is your public page. Customers can favourite it and get an email whenever you post a new
            promotion.
          </p>
        </div>
        {data?.id ? (
          <Button as={Link} to={`/app/shops/${data.id}`} variant="secondary" icon={Store}>
            View public page
          </Button>
        ) : null}
      </div>

      {error && error.isMissing ? (
        <div className="mt-6">
          <ErrorState error={error} onRetry={reload} compact />
        </div>
      ) : null}

      <div className="mt-6 flex items-center gap-4 rounded-3xl bg-surface p-5 ring-1 ring-line/80 shadow-card">
        {form.profileImageUrl ? (
          <img src={form.profileImageUrl} alt="" className="size-16 rounded-2xl object-cover" />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-100 font-display text-lg font-extrabold text-brand-700">
            {initials(form.name || 'Shop') || <Store className="size-7" />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-ink">
            {form.name || 'Your shop name'}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="text-xs font-bold text-muted">{completeness}% complete</span>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <Card className="space-y-5">
          <h2 className="font-display text-base font-bold text-ink">Basics</h2>
          <Input
            label="Shop name"
            required
            icon={Store}
            value={form.name}
            onChange={update('name')}
            error={errors.name}
          />
          <Textarea
            label="About the business"
            rows={3}
            placeholder="Small-batch bakery. Whatever is left after 6pm goes out at rescue prices."
            value={form.description}
            onChange={update('description')}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Profile image URL"
              icon={ImageIcon}
              value={form.profileImageUrl}
              onChange={update('profileImageUrl')}
            />
            <Input
              label="Cover image URL"
              icon={ImageIcon}
              hint="Optional banner for your public page."
              value={form.coverImageUrl}
              onChange={update('coverImageUrl')}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">What do you sell?</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Chip
                  key={category.slug}
                  active={form.categories.includes(category.slug)}
                  onClick={() => toggleCategory(category.slug)}
                >
                  {category.emoji} {category.name}
                </Chip>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold text-ink">Where to collect</h2>
            <Button type="button" variant="soft" size="sm" icon={Compass} onClick={useMyLocation}>
              Use my current location
            </Button>
          </div>
          <Input label="Street address" icon={MapPin} value={form.address} onChange={update('address')} />
          <div className="grid gap-5 sm:grid-cols-3">
            <Input label="City" value={form.city} onChange={update('city')} />
            <Input
              label="Latitude"
              type="number"
              step="0.00001"
              hint="Used for distance sorting."
              value={form.latitude}
              onChange={update('latitude')}
            />
            <Input
              label="Longitude"
              type="number"
              step="0.00001"
              value={form.longitude}
              onChange={update('longitude')}
            />
          </div>
        </Card>

        <Card className="space-y-5">
          <h2 className="font-display text-base font-bold text-ink">Contact and hours</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Phone"
              icon={Phone}
              value={form.contactPhone}
              onChange={update('contactPhone')}
            />
            <Input
              label="Email"
              type="email"
              icon={AtSign}
              value={form.contactEmail}
              onChange={update('contactEmail')}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Weekday hours"
              placeholder="07:00 – 20:00"
              value={form.openingHours.weekdays}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  openingHours: { ...current.openingHours, weekdays: event.target.value },
                }))
              }
            />
            <Input
              label="Weekend hours"
              placeholder="08:00 – 21:00"
              value={form.openingHours.weekends}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  openingHours: { ...current.openingHours, weekends: event.target.value },
                }))
              }
            />
          </div>
        </Card>

        {submitError ? <ErrorState error={submitError} compact /> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" icon={Save} loading={submitting}>
            {data?.id ? 'Save profile' : 'Create shop'}
          </Button>
          {data?.id ? (
            <Badge tone="neutral">
              Public link: /app/shops/{data.id}
            </Badge>
          ) : null}
        </div>
      </form>
    </div>
  )
}
