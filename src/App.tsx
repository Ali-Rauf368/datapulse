import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Activity,
  AlertTriangle,
  Bell,
  CarFront,
  ChartNoAxesCombined,
  CircleCheck,
  Clock,
  Database,
  Euro,
  LayoutDashboard,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')
const TOKEN_KEY = 'datapulse_token'
const USER_KEY = 'datapulse_user'

type Role = 'admin' | 'operator' | 'viewer'
type VehicleStatus = 'active' | 'sold' | 'in_service'

type User = {
  id: string
  email: string
  role: Role
}

type Vehicle = {
  id: number
  vin: string
  make: string
  model: string
  model_year: number
  status: VehicleStatus
  created_at: string
}

type VehicleStats = {
  total: number
  active: number
  sold: number
  in_service: number
}

type VehicleForm = {
  vin: string
  make: string
  model: string
  model_year: string
  status: VehicleStatus
}

type LoginResponse = {
  token: string
  user: User
}

type SalesAnalytics = {
  totalSales: number
  totalRevenue: number
  hasData: boolean
  daily: Array<{
    date: string
    sales: number
    revenue: number
  }>
}

type ServiceAnalytics = {
  total: number
  open: number
  in_progress: number
  completed: number
  cancelled: number
  hasData: boolean
  recent: Array<{
    id: number
    vehicle_id: number | null
    vehicle: string | null
    status: string
    description: string
    opened_at: string
    completed_at: string | null
  }>
}

type ApiErrorBody = {
  error?: string
}

const emptyStats: VehicleStats = {
  total: 0,
  active: 0,
  sold: 0,
  in_service: 0,
}

const emptySales: SalesAnalytics = {
  totalSales: 0,
  totalRevenue: 0,
  hasData: false,
  daily: [],
}

const emptyService: ServiceAnalytics = {
  total: 0,
  open: 0,
  in_progress: 0,
  completed: 0,
  cancelled: 0,
  hasData: false,
  recent: [],
}

const initialVehicleForm: VehicleForm = {
  vin: '',
  make: '',
  model: '',
  model_year: String(new Date().getFullYear()),
  status: 'active',
}

const navigation = [
  { label: 'Overview', icon: LayoutDashboard, href: '#overview' },
  { label: 'Data sources', icon: Database, href: '#data-sources' },
  { label: 'Processing runs', icon: Activity, href: '#processing-runs' },
  { label: 'Analytics', icon: ChartNoAxesCombined, href: '#analytics' },
  { label: 'Users & roles', icon: Users, href: '#users-roles' },
  { label: 'Settings', icon: Settings, href: '#settings' },
]

const statusStyles: Record<VehicleStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  sold: 'bg-slate-100 text-slate-700',
  in_service: 'bg-amber-50 text-amber-700',
}

const statusLabels: Record<VehicleStatus, string> = {
  active: 'Active',
  sold: 'Sold',
  in_service: 'In service',
}

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null

    const user = JSON.parse(raw) as User

    if (
      typeof user.id !== 'string' ||
      typeof user.email !== 'string' ||
      !['admin', 'operator', 'viewer'].includes(user.role)
    ) {
      return null
    }

    return user
  } catch {
    return null
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & ApiErrorBody

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`)
  }

  return data
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString()
}

function App() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  )
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [stats, setStats] = useState<VehicleStats>(emptyStats)
  const [sales, setSales] = useState<SalesAnalytics>(emptySales)
  const [service, setService] = useState<ServiceAnalytics>(emptyService)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null)
  const [vehicleForm, setVehicleForm] =
    useState<VehicleForm>(initialVehicleForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin'
  const canEdit = user?.role === 'admin' || user?.role === 'operator'

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    setVehicles([])
    setStats(emptyStats)
    setSales(emptySales)
    setService(emptyService)
    setLoading(false)
    setApiError(null)
    setLastUpdated(null)
    setShowVehicleForm(false)
    setEditingVehicleId(null)
    setFormSuccess(null)
    setActionError(null)
  }, [])

  const apiFetch = useCallback(
    async (path: string, options: RequestInit = {}): Promise<Response> => {
      if (!token) throw new Error('Please sign in to continue.')

      const headers = new Headers(options.headers)
      headers.set('Authorization', `Bearer ${token}`)

      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      })

      if (response.status === 401) {
        signOut()
        throw new Error('Your session has expired. Please sign in again.')
      }

      return response
    },
    [token, signOut],
  )

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return

      setLoading(true)
      setApiError(null)

      try {
        const params = new URLSearchParams()

        if (search.trim()) params.set('search', search.trim())
        if (statusFilter !== 'all') params.set('status', statusFilter)

        const query = params.toString()
        const vehiclesPath = `/vehicles${query ? `?${query}` : ''}`

        const [
          vehiclesResponse,
          statsResponse,
          salesResponse,
          serviceResponse,
        ] = await Promise.all([
          apiFetch(vehiclesPath, { signal }),
          apiFetch('/vehicles/stats', { signal }),
          apiFetch('/analytics/sales', { signal }),
          apiFetch('/analytics/service', { signal }),
        ])

        const [vehicleData, statsData, salesData, serviceData] =
          await Promise.all([
            readJson<Vehicle[]>(vehiclesResponse),
            readJson<VehicleStats>(statsResponse),
            readJson<SalesAnalytics>(salesResponse),
            readJson<ServiceAnalytics>(serviceResponse),
          ])

        if (signal?.aborted) return

        if (
          !Array.isArray(vehicleData) ||
          !Array.isArray(salesData.daily) ||
          !Array.isArray(serviceData.recent)
        ) {
          throw new Error('The API returned an unexpected response format.')
        }

        setVehicles(vehicleData)
        setStats(statsData)
        setSales(salesData)
        setService(serviceData)
        setLastUpdated(new Date().toLocaleTimeString())
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return

        if (!signal?.aborted) {
          setApiError(
            error instanceof Error
              ? error.message
              : 'Could not load data from the DataPulse API.',
          )
        }
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [apiFetch, search, statusFilter, token],
  )

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const timer = window.setTimeout(
      () => void loadData(controller.signal),
      search ? 250 : 0,
    )

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadData, search, token])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError(null)
    setLoginLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      })

      const result = await readJson<LoginResponse>(response)

      if (
        !result.token ||
        !result.user ||
        typeof result.user.id !== 'string' ||
        typeof result.user.email !== 'string' ||
        !['admin', 'operator', 'viewer'].includes(result.user.role)
      ) {
        throw new Error('The login API returned an invalid response.')
      }

      localStorage.setItem(TOKEN_KEY, result.token)
      localStorage.setItem(USER_KEY, JSON.stringify(result.user))
      setToken(result.token)
      setUser(result.user)
      setLoginPassword('')
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : 'Could not sign in.',
      )
    } finally {
      setLoginLoading(false)
    }
  }

  function updateVehicleForm<K extends keyof VehicleForm>(
    field: K,
    value: VehicleForm[K],
  ) {
    setVehicleForm((current) => ({ ...current, [field]: value }))
    setFormError(null)
    setFormSuccess(null)
  }

  function openCreateForm() {
    setEditingVehicleId(null)
    setVehicleForm(initialVehicleForm)
    setFormError(null)
    setFormSuccess(null)
    setShowVehicleForm(true)
  }

  function openEditForm(vehicle: Vehicle) {
    if (!canEdit) return

    setEditingVehicleId(vehicle.id)
    setVehicleForm({
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      model_year: String(vehicle.model_year),
      status: vehicle.status,
    })
    setFormError(null)
    setFormSuccess(null)
    setShowVehicleForm(true)
  }

  function closeForm() {
    setShowVehicleForm(false)
    setEditingVehicleId(null)
    setVehicleForm(initialVehicleForm)
    setFormError(null)
    setFormSuccess(null)
  }

  async function handleSaveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    if (!canEdit) {
      setFormError('Your role does not permit vehicle changes.')
      return
    }

    const vin = vehicleForm.vin.trim().toUpperCase()
    const make = vehicleForm.make.trim()
    const model = vehicleForm.model.trim()
    const modelYear = Number(vehicleForm.model_year)

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      setFormError(
        'Enter a valid 17-character VIN. Letters I, O and Q are not allowed.',
      )
      return
    }

    if (!make || make.length > 100 || !model || model.length > 100) {
      setFormError(
        'Make and model must each contain between 1 and 100 characters.',
      )
      return
    }

    if (
      !Number.isInteger(modelYear) ||
      modelYear < 1886 ||
      modelYear > 2100
    ) {
      setFormError('Enter a model year between 1886 and 2100.')
      return
    }

    setSubmitting(true)

    try {
      const editing = editingVehicleId !== null
      const path = editing
        ? `/vehicles/${editingVehicleId}`
        : '/vehicles'

      const response = await apiFetch(path, {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify({
          vin,
          make,
          model,
          model_year: modelYear,
          status: vehicleForm.status,
        }),
      })

      const savedVehicle = await readJson<Vehicle>(response)

      closeForm()
      setFormSuccess(
        editing
          ? `${savedVehicle.make} ${savedVehicle.model} updated successfully.`
          : `${savedVehicle.make} ${savedVehicle.model} created successfully.`,
      )

      await loadData()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Could not save the vehicle.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteVehicle(vehicle: Vehicle) {
    if (!isAdmin) {
      setActionError('Only an administrator can delete vehicle records.')
      return
    }

    const confirmed = window.confirm(
      `Permanently delete ${vehicle.make} ${vehicle.model} (ID ${vehicle.id})? This cannot be undone.`,
    )

    if (!confirmed) return

    setDeletingId(vehicle.id)
    setActionError(null)
    setFormSuccess(null)

    try {
      const response = await apiFetch(`/vehicles/${vehicle.id}`, {
        method: 'DELETE',
      })

      await readJson<{ message: string; vehicle: Vehicle }>(response)

      setFormSuccess(`${vehicle.make} ${vehicle.model} was deleted.`)
      await loadData()
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Could not delete the vehicle.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (!token || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <Activity size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">DataPulse</h1>
              <p className="text-sm text-slate-500">
                Automotive intelligence
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in with your DataPulse account to access inventory and analytics.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            {loginError && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
              >
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginLoading && (
                <RefreshCw size={16} className="animate-spin" />
              )}
              {loginLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-xs leading-5 text-slate-400">
            Access is controlled by your DataPulse account role.
          </p>
        </section>
      </main>
    )
  }

  const metrics = [
    {
      label: 'Vehicles in inventory',
      value: String(stats.total),
      detail: 'Total records in PostgreSQL',
      icon: CarFront,
    },
    {
      label: 'Active vehicles',
      value: String(stats.active),
      detail: 'Currently marked active',
      icon: CircleCheck,
    },
    {
      label: 'Sold vehicles',
      value: String(stats.sold),
      detail: 'Currently marked sold',
      icon: Euro,
    },
    {
      label: 'In service',
      value: String(stats.in_service),
      detail: 'Currently in service',
      icon: Wrench,
    },
  ]

  const salesChartData = sales.daily.map((item) => ({
    ...item,
    label: formatDate(item.date),
  }))

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="bg-slate-950 p-6 text-white md:min-h-screen md:w-64 md:shrink-0">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
            <Activity size={23} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">DataPulse</h1>
            <p className="text-xs text-slate-400">
              Automotive intelligence
            </p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav aria-label="Main navigation" className="space-y-1">
          {navigation.map(({ label, icon: Icon, href }, index) => (
            <a
              key={label}
              href={href}
              aria-current={index === 0 ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                index === 0
                  ? 'bg-cyan-400/15 font-semibold text-cyan-300'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={19} />
              {label}
            </a>
          ))}
        </nav>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                apiError
                  ? 'bg-rose-400'
                  : loading
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
              }`}
            />
            {apiError
              ? 'API unavailable'
              : loading
                ? 'Loading data'
                : 'Authenticated'}
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Protected DataPulse API session.
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 p-4">
          <p className="break-all text-sm font-medium">{user.email}</p>
          <p className="mt-1 text-xs capitalize text-cyan-300">
            {user.role} role
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main id="overview" className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm text-slate-500">
              Workspace / Overview
            </p>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Business overview
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Monitor vehicle inventory, sales, services and data operations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            aria-label="Refresh dashboard data"
            title="Refresh dashboard data"
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:bg-slate-100"
          >
            <Bell size={20} />
          </button>
        </header>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Key performance indicators</h3>
            <p className="mt-1 text-xs text-slate-500">
              Live inventory statistics from PostgreSQL.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800">
            <ShieldCheck size={14} />
            Authenticated workspace
          </span>
        </div>

        <section
          aria-label="Key performance indicators"
          className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map(({ label, value, detail, icon: Icon }) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700">
                  <Icon size={20} aria-hidden="true" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight">
                {apiError ? '—' : loading && !lastUpdated ? '…' : value}
              </p>
              <div className="mt-2 flex items-start gap-1.5">
                {apiError ? (
                  <AlertTriangle
                    size={15}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                ) : (
                  <CircleCheck
                    size={15}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                )}
                <p className="text-xs leading-5 text-slate-500">
                  {apiError ? 'API unavailable' : detail}
                </p>
              </div>
            </article>
          ))}
        </section>

        <section
          id="data-sources"
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">Vehicle inventory</h3>
              <p className="mt-1 text-sm text-slate-500">
                Search, filter and manage PostgreSQL vehicle records.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
                >
                  <Plus size={16} /> Add vehicle
                </button>
              )}
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={loading ? 'animate-spin' : ''}
                />
                Refresh
              </button>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_200px]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                aria-label="Search vehicles"
                placeholder="Search VIN, make or model..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
            <select
              aria-label="Filter vehicles by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="in_service">In service</option>
            </select>
          </div>

          {showVehicleForm && canEdit && (
            <form
              onSubmit={handleSaveVehicle}
              className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">
                    {editingVehicleId === null
                      ? 'Add a vehicle'
                      : `Edit vehicle #${editingVehicleId}`}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Changes are saved to PostgreSQL.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close vehicle form"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label
                    htmlFor="vehicle-vin"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    VIN
                  </label>
                  <input
                    id="vehicle-vin"
                    value={vehicleForm.vin}
                    onChange={(event) =>
                      updateVehicleForm('vin', event.target.value)
                    }
                    placeholder="17-character VIN"
                    maxLength={17}
                    required
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="vehicle-make"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Make
                  </label>
                  <input
                    id="vehicle-make"
                    value={vehicleForm.make}
                    onChange={(event) =>
                      updateVehicleForm('make', event.target.value)
                    }
                    placeholder="e.g. Toyota"
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="vehicle-model"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Model
                  </label>
                  <input
                    id="vehicle-model"
                    value={vehicleForm.model}
                    onChange={(event) =>
                      updateVehicleForm('model', event.target.value)
                    }
                    placeholder="e.g. Corolla"
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="vehicle-year"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Model year
                  </label>
                  <input
                    id="vehicle-year"
                    type="number"
                    min={1886}
                    max={2100}
                    step={1}
                    value={vehicleForm.model_year}
                    onChange={(event) =>
                      updateVehicleForm('model_year', event.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="vehicle-status"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Status
                  </label>
                  <select
                    id="vehicle-status"
                    value={vehicleForm.status}
                    onChange={(event) =>
                      updateVehicleForm(
                        'status',
                        event.target.value as VehicleStatus,
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="in_service">In service</option>
                  </select>
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                >
                  {formError}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && (
                    <RefreshCw size={15} className="animate-spin" />
                  )}
                  {submitting
                    ? 'Saving...'
                    : editingVehicleId === null
                      ? 'Save vehicle'
                      : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {formSuccess && (
            <p
              role="status"
              className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
            >
              {formSuccess}
            </p>
          )}
          {actionError && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {actionError}
            </p>
          )}
          {apiError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              <p>Could not load dashboard data: {apiError}</p>
              <p className="mt-1 text-xs">
                Check the API and database connection, then refresh.
              </p>
            </div>
          )}

          {loading && vehicles.length === 0 && !apiError ? (
            <div
              role="status"
              className="flex items-center gap-3 py-12 text-sm text-slate-500"
            >
              <RefreshCw size={18} className="animate-spin" />
              Loading vehicle records...
            </div>
          ) : !apiError && vehicles.length === 0 ? (
            <div className="py-10 text-center">
              <CarFront size={30} className="mx-auto mb-3 text-slate-400" />
              <p className="font-medium">No vehicles found</p>
              <p className="mt-1 text-sm text-slate-500">
                {search || statusFilter !== 'all'
                  ? 'Try changing your search or filter.'
                  : 'Add a vehicle or ingest one through NiFi.'}
              </p>
            </div>
          ) : vehicles.length > 0 ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>
                  {vehicles.length} result{vehicles.length === 1 ? '' : 's'}
                </span>
                <span className="text-slate-300">•</span>
                <span>{stats.total} total database records</span>
                {lastUpdated && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>Updated at {lastUpdated}</span>
                  </>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-y border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-3 pr-4 font-medium">
                        Vehicle
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Model year
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Record ID
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-medium"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicles.map((vehicle) => (
                      <tr
                        key={vehicle.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                              <CarFront size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {vehicle.make} {vehicle.model}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {vehicle.vin}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {vehicle.model_year}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[vehicle.status]}`}
                          >
                            {statusLabels[vehicle.status]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          #{vehicle.id}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openEditForm(vehicle)}
                                aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
                              >
                                Edit
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => void handleDeleteVehicle(vehicle)}
                                disabled={deletingId === vehicle.id}
                                aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                              >
                                {deletingId === vehicle.id ? (
                                  <RefreshCw
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={13} />
                                )}
                                Delete
                              </button>
                            )}
                            {!canEdit && !isAdmin && (
                              <span className="px-3 py-1.5 text-xs text-slate-400">
                                View only
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          <div className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
            <Database size={15} className="mt-0.5 shrink-0" />
            <p>
              Source: DataPulse REST API backed by PostgreSQL. Existing vehicle
              records are preserved. Sales and service metrics are sourced from
              their own database tables.
            </p>
          </div>
        </section>

        <section id="analytics" className="grid gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Sales activity</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Daily recorded sales · last seven days
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {formatMoney(sales.totalRevenue)}
                </p>
                <p className="text-xs text-slate-500">
                  Total recorded revenue
                </p>
              </div>
            </div>

            {sales.hasData && salesChartData.length > 0 ? (
              <div
                role="img"
                aria-label="Daily recorded sales from the sales events database table"
                className="h-64 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesChartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} sales`, 'Sales']}
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="sales"
                      name="Recorded sales"
                      fill="#06b6d4"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <ChartNoAxesCombined
                  size={30}
                  className="mb-3 text-slate-400"
                />
                <p className="font-medium">No sales data yet</p>
                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                  Sales activity will appear here when real records are added
                  to the sales events table. No sample sales are shown.
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
              <span>{sales.totalSales} recorded sales</span>
              <span>Source: PostgreSQL sales events</span>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Service activity</h3>
              <Wrench size={18} className="text-slate-400" />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Recorded service events
            </p>

            {service.hasData ? (
              <div className="mt-6 space-y-4">
                {[
                  { label: 'Open', value: service.open, color: 'bg-amber-500' },
                  {
                    label: 'In progress',
                    value: service.in_progress,
                    color: 'bg-cyan-500',
                  },
                  {
                    label: 'Completed',
                    value: service.completed,
                    color: 'bg-emerald-500',
                  },
                  {
                    label: 'Cancelled',
                    value: service.cancelled,
                    color: 'bg-slate-400',
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex justify-between gap-3 text-sm">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{
                          width: `${
                            service.total > 0
                              ? Math.min(100, (item.value / service.total) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                  {service.total} total recorded service events
                </p>
              </div>
            ) : (
              <div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                <Wrench size={28} className="mb-3 text-slate-400" />
                <p className="font-medium">No service data yet</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Service metrics will appear when service events are recorded.
                </p>
              </div>
            )}
          </article>
        </section>

        <section
          id="processing-runs"
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">System status</h3>
            <Activity size={18} className="text-slate-400" />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            DataPulse API and database connection
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex gap-3">
              {apiError ? (
                <AlertTriangle size={18} className="shrink-0 text-rose-600" />
              ) : (
                <CircleCheck size={18} className="shrink-0 text-emerald-600" />
              )}
              <div>
                <p className="text-sm font-medium">API connection</p>
                <p className="mt-1 text-xs text-slate-500">
                  {apiError ? 'Request failed' : 'Authenticated API session'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Database size={18} className="shrink-0 text-cyan-600" />
              <div>
                <p className="text-sm font-medium">Vehicle inventory</p>
                <p className="mt-1 text-xs text-slate-500">
                  {stats.total} stored vehicle records
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock size={18} className="shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-medium">Last refresh</p>
                <p className="mt-1 text-xs text-slate-500">
                  {lastUpdated ?? 'Not refreshed yet'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck size={18} className="shrink-0 text-cyan-600" />
              <div>
                <p className="text-sm font-medium">Access role</p>
                <p className="mt-1 text-xs capitalize text-slate-500">
                  {user.role}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-3">
            <p className="text-xs leading-5 text-slate-500">
              Vehicle and analytics requests use a bearer token. The API must
              enforce permissions independently of dashboard controls.
            </p>
          </div>
        </section>

        <section
          id="users-roles"
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Users size={20} className="text-cyan-700" />
            <div>
              <h3 className="font-semibold">Users & roles</h3>
              <p className="mt-1 text-sm text-slate-500">
                Your current account access
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
            <div>
              <p className="break-all text-sm font-medium">{user.email}</p>
              <p className="mt-1 text-xs capitalize text-slate-500">
                Role: {user.role}
              </p>
            </div>
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium capitalize text-cyan-800">
              {user.role}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            {isAdmin
              ? 'You have administrator permissions. User creation and role management require a dedicated backend endpoint and are not enabled in this screen.'
              : user.role === 'operator'
                ? 'You can create and edit vehicle records. Deleting records and administrator account management are restricted.'
                : 'You have read-only access to inventory and analytics.'}
          </p>
        </section>

        <section
          id="settings"
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-slate-500" />
            <div>
              <h3 className="font-semibold">Session settings</h3>
              <p className="mt-1 text-sm text-slate-500">
                Manage the current browser session.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            <LogOut size={16} /> Sign out
          </button>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>DataPulse · Automotive data intelligence</span>
          <span>
            {apiError
              ? 'API connection unavailable'
              : loading
                ? 'Refreshing data...'
                : 'Dashboard connected'}
          </span>
        </footer>
      </main>
    </div>
  )
}

export default App