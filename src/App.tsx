
import { useCallback, useEffect, useState } from 'react'
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

const API_URL = 'http://localhost:3000/api'

type VehicleStatus = 'active' | 'sold' | 'in_service'

type Vehicle = {
  id: number
  vin: string
  make: string
  model: string
  model_year: number
  status: VehicleStatus
  created_at: string
}

type VehiclesResponse = {
  count: number
  vehicles: Vehicle[]
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

const emptyStats: VehicleStats = {
  total: 0,
  active: 0,
  sold: 0,
  in_service: 0,
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

const salesData = [
  { day: 'Mon', sales: 42 },
  { day: 'Tue', sales: 65 },
  { day: 'Wed', sales: 51 },
  { day: 'Thu', sales: 80 },
  { day: 'Fri', sales: 58 },
  { day: 'Sat', sales: 92 },
  { day: 'Sun', sales: 72 },
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

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`)
  }

  return data
}

function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [stats, setStats] = useState<VehicleStats>(emptyStats)
  const [loading, setLoading] = useState(true)
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

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setApiError(null)

    try {
      const params = new URLSearchParams()

      if (search.trim()) params.set('search', search.trim())
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const query = params.toString()
      const vehiclesUrl = `${API_URL}/vehicles${query ? `?${query}` : ''}`

      const [vehiclesResponse, statsResponse] = await Promise.all([
        fetch(vehiclesUrl, { signal }),
        fetch(`${API_URL}/vehicles/stats`, { signal }),
      ])

      const [vehicleData, statsData] = await Promise.all([
        readJson<VehiclesResponse>(vehiclesResponse),
        readJson<VehicleStats>(statsResponse),
      ])

      if (signal?.aborted) return

      setVehicles(vehicleData.vehicles)
      setStats(statsData)
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
  }, [search, statusFilter])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadData(controller.signal)
    }, search ? 250 : 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadData, search])

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

  async function handleSaveVehicle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const vin = vehicleForm.vin.trim().toUpperCase()
    const make = vehicleForm.make.trim()
    const model = vehicleForm.model.trim()
    const modelYear = Number(vehicleForm.model_year)

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      setFormError('Enter a valid 17-character VIN. Letters I, O and Q are not allowed.')
      return
    }

    if (!make || make.length > 100 || !model || model.length > 100) {
      setFormError('Make and model must each contain between 1 and 100 characters.')
      return
    }

    if (!Number.isInteger(modelYear) || modelYear < 1886 || modelYear > 2100) {
      setFormError('Enter a model year between 1886 and 2100.')
      return
    }

    setSubmitting(true)

    try {
      const editing = editingVehicleId !== null
      const url = editing
        ? `${API_URL}/vehicles/${editingVehicleId}`
        : `${API_URL}/vehicles`

      const response = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vin,
          make,
          model,
          model_year: modelYear,
          status: vehicleForm.status,
        }),
      })

      const data = await readJson<{
        message: string
        vehicle: Vehicle
      }>(response)

      setFormSuccess(data.message)
      setVehicleForm(initialVehicleForm)
      setEditingVehicleId(null)
      setShowVehicleForm(false)
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
    const confirmed = window.confirm(
      `Permanently delete ${vehicle.make} ${vehicle.model} (ID ${vehicle.id})? This cannot be undone.`,
    )

    if (!confirmed) return

    setDeletingId(vehicle.id)
    setActionError(null)
    setFormSuccess(null)

    try {
      const response = await fetch(`${API_URL}/vehicles/${vehicle.id}`, {
        method: 'DELETE',
      })

      await readJson<{ message: string }>(response)
      setFormSuccess(`${vehicle.make} ${vehicle.model} was deleted.`)
      await loadData()
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Could not delete the vehicle.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  const metrics = [
    {
      label: 'Vehicles in inventory',
      value: String(stats.total),
      detail: 'Total records in PostgreSQL',
      icon: CarFront,
      warning: false,
    },
    {
      label: 'Active vehicles',
      value: String(stats.active),
      detail: 'Currently marked active',
      icon: CircleCheck,
      warning: false,
    },
    {
      label: 'Sold vehicles',
      value: String(stats.sold),
      detail: 'Currently marked sold',
      icon: Euro,
      warning: false,
    },
    {
      label: 'In service',
      value: String(stats.in_service),
      detail: 'Currently in service',
      icon: Wrench,
      warning: false,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="bg-slate-950 p-6 text-white md:min-h-screen md:w-64 md:shrink-0">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
            <Activity size={23} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">DataPulse</h1>
            <p className="text-xs text-slate-400">Automotive intelligence</p>
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

        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <span className={`h-2 w-2 rounded-full ${
              apiError ? 'bg-rose-400' : loading ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            {apiError ? 'API unavailable' : loading ? 'Connecting' : 'Database connected'}
          </div>
          <p className="text-xs leading-5 text-slate-400">
            {apiError
              ? 'Could not retrieve data from the API.'
              : 'Inventory and status totals are loaded from PostgreSQL.'}
          </p>
        </div>
      </aside>

      <main id="overview" className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm text-slate-500">Workspace / Overview</p>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Business overview
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Monitor vehicle inventory and data operations.
            </p>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
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
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            Portfolio demo
          </span>
        </div>

        <section aria-label="Key performance indicators" className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, detail, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
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
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                ) : (
                  <CircleCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                )}
                <p className="text-xs leading-5 text-slate-500">{apiError ? 'API unavailable' : detail}</p>
              </div>
            </article>
          ))}
        </section>

        <section id="data-sources" className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">Vehicle inventory</h3>
              <p className="mt-1 text-sm text-slate-500">
                Search, filter, create, edit and delete PostgreSQL vehicle records.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
              >
                <Plus size={16} /> Add vehicle
              </button>
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_200px]">
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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

          {showVehicleForm && (
            <form onSubmit={handleSaveVehicle} className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">
                    {editingVehicleId === null ? 'Add a vehicle' : `Edit vehicle #${editingVehicleId}`}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingVehicleId === null
                      ? 'Create a new record in PostgreSQL.'
                      : 'Update the selected vehicle record.'}
                  </p>
                </div>
                <button type="button" onClick={closeForm} aria-label="Close vehicle form" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200">
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="vehicle-vin" className="mb-1.5 block text-sm font-medium text-slate-700">VIN</label>
                  <input id="vehicle-vin" value={vehicleForm.vin} onChange={(event) => updateVehicleForm('vin', event.target.value)} placeholder="17-character VIN" maxLength={17} required autoComplete="off" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
                </div>
                <div>
                  <label htmlFor="vehicle-make" className="mb-1.5 block text-sm font-medium text-slate-700">Make</label>
                  <input id="vehicle-make" value={vehicleForm.make} onChange={(event) => updateVehicleForm('make', event.target.value)} placeholder="e.g. Toyota" maxLength={100} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
                </div>
                <div>
                  <label htmlFor="vehicle-model" className="mb-1.5 block text-sm font-medium text-slate-700">Model</label>
                  <input id="vehicle-model" value={vehicleForm.model} onChange={(event) => updateVehicleForm('model', event.target.value)} placeholder="e.g. Corolla" maxLength={100} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
                </div>
                <div>
                  <label htmlFor="vehicle-year" className="mb-1.5 block text-sm font-medium text-slate-700">Model year</label>
                  <input id="vehicle-year" type="number" min={1886} max={2100} step={1} value={vehicleForm.model_year} onChange={(event) => updateVehicleForm('model_year', event.target.value)} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
                </div>
                <div>
                  <label htmlFor="vehicle-status" className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                  <select id="vehicle-status" value={vehicleForm.status} onChange={(event) => updateVehicleForm('status', event.target.value as VehicleStatus)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100">
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="in_service">In service</option>
                  </select>
                </div>
              </div>

              {formError && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{formError}</p>}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting && <RefreshCw size={15} className="animate-spin" />}
                  {submitting ? 'Saving...' : editingVehicleId === null ? 'Save vehicle' : 'Save changes'}
                </button>
                <button type="button" onClick={closeForm} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-100">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {formSuccess && (
            <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{formSuccess}</p>
          )}
          {actionError && (
            <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>
          )}
          {apiError && (
            <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>Could not load inventory: {apiError}</p>
              <p className="mt-1 text-xs">Check that the API and PostgreSQL are running.</p>
            </div>
          )}

          {loading && vehicles.length === 0 && !apiError ? (
            <div role="status" className="flex items-center gap-3 py-12 text-sm text-slate-500">
              <RefreshCw size={18} className="animate-spin" /> Loading vehicle records...
            </div>
          ) : !apiError && vehicles.length === 0 ? (
            <div className="py-10 text-center">
              <CarFront size={30} className="mx-auto mb-3 text-slate-400" />
              <p className="font-medium">No vehicles found</p>
              <p className="mt-1 text-sm text-slate-500">
                {search || statusFilter !== 'all' ? 'Try changing your search or filter.' : 'Add a vehicle or ingest one through NiFi.'}
              </p>
            </div>
          ) : vehicles.length > 0 ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>{vehicles.length} result{vehicles.length === 1 ? '' : 's'}</span>
                <span className="text-slate-300">•</span>
                <span>{stats.total} total database records</span>
                {lastUpdated && <>
                  <span className="text-slate-300">•</span>
                  <span>Updated at {lastUpdated}</span>
                </>}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-y border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-3 pr-4 font-medium">Vehicle</th>
                      <th scope="col" className="px-4 py-3 font-medium">Model year</th>
                      <th scope="col" className="px-4 py-3 font-medium">Status</th>
                      <th scope="col" className="px-4 py-3 font-medium">Record ID</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="transition-colors hover:bg-slate-50">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                              <CarFront size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{vehicle.make} {vehicle.model}</p>
                              <p className="mt-1 text-xs text-slate-500">{vehicle.vin}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{vehicle.model_year}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[vehicle.status]}`}>
                            {statusLabels[vehicle.status]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500">#{vehicle.id}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => openEditForm(vehicle)} aria-label={`Edit ${vehicle.make} ${vehicle.model}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-100">
                              Edit
                            </button>
                            <button type="button" onClick={() => void handleDeleteVehicle(vehicle)} disabled={deletingId === vehicle.id} aria-label={`Delete ${vehicle.make} ${vehicle.model}`} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                              {deletingId === vehicle.id ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              Delete
                            </button>
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
              Source: DataPulse REST API backed by PostgreSQL. Vehicle records are synthetic portfolio demo data. Deletion permanently removes a record.
            </p>
          </div>
        </section>

        <section id="analytics" className="grid gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Sales activity</h3>
                <p className="mt-1 text-sm text-slate-500">Illustrative daily sales volume</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500" />
                Vehicles sold
              </div>
            </div>
            <div role="img" aria-label="Illustrative daily vehicle sales from Monday to Sunday" className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} vehicles`, 'Sales']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="sales" name="Vehicles sold" fill="#06b6d4" radius={[5, 5, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-xs text-slate-400">Source: synthetic sample data · Not connected to sales systems</p>
          </article>

          <article id="processing-runs" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">System status</h3>
              <Activity size={18} className="text-slate-400" aria-hidden="true" />
            </div>
            <p className="mt-1 text-sm text-slate-500">DataPulse API and inventory</p>

            <div className="mt-6 space-y-5">
              <div className="flex gap-3">
                {apiError ? <AlertTriangle size={18} className="shrink-0 text-rose-600" /> : <CircleCheck size={18} className="shrink-0 text-emerald-600" />}
                <div>
                  <p className="text-sm font-medium">API connection</p>
                  <p className="mt-1 text-xs text-slate-500">{apiError ? 'Connection error' : 'Vehicle API responses received'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Database size={18} className="shrink-0 text-cyan-600" />
                <div>
                  <p className="text-sm font-medium">PostgreSQL inventory</p>
                  <p className="mt-1 text-xs text-slate-500">{stats.total} stored vehicle records</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock size={18} className="shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm font-medium">Last refresh</p>
                  <p className="mt-1 text-xs text-slate-500">{lastUpdated ?? 'Not refreshed yet'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck size={18} className="shrink-0 text-cyan-600" />
                <div>
                  <p className="text-sm font-medium">Input validation</p>
                  <p className="mt-1 text-xs text-slate-500">API validates VIN, model year, and status.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-slate-50 p-3">
              <p className="text-xs leading-5 text-slate-500">
                Sales analytics remain illustrative. Vehicle inventory and status counts are database-backed.
              </p>
            </div>
          </article>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>DataPulse · Automotive data intelligence</span>
          <span>{apiError ? 'API connection unavailable' : loading ? 'Refreshing data...' : 'PostgreSQL inventory connected'}</span>
        </footer>
      </main>
    </div>
  )
}

export default App
