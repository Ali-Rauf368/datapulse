
import { useEffect, useState } from 'react'
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  Database,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  CarFront,
  Wrench,
  Euro,
  ArrowUpRight,
  CircleCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Vehicle = {
  id: string
  vin: string
  make: string
  model: string
  model_year: number
  status: 'active' | 'sold' | 'in_service'
  created_at: string
}

type VehiclesResponse = {
  count: number
  vehicles: Vehicle[]
}

type VehicleForm = {
  vin: string
  make: string
  model: string
  model_year: string
  status: Vehicle['status']
}

const initialVehicleForm: VehicleForm = {
  vin: '',
  make: '',
  model: '',
  model_year: String(new Date().getFullYear()),
  status: 'active',
}

const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Data sources', icon: Database },
  { label: 'Processing runs', icon: Activity },
  { label: 'Analytics', icon: ChartNoAxesCombined },
  { label: 'Users & roles', icon: Users },
  { label: 'Settings', icon: Settings },
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

const demoMetrics = [
  {
    label: 'Sales revenue',
    value: '€2.48M',
    detail: 'Synthetic monthly demo figure',
    icon: Euro,
    trend: 'up',
  },
  {
    label: 'Service orders',
    value: '342',
    detail: 'Illustrative demo figure',
    icon: Wrench,
    trend: 'up',
  },
]

const recentActivity = [
  {
    title: 'Vehicle inventory endpoint created',
    detail: 'DataPulse API · PostgreSQL',
    time: 'Current session',
    status: 'success',
  },
  {
    title: 'Toyota and Lexus sample records added',
    detail: 'Vehicle inventory · Demo records',
    time: 'Current session',
    status: 'success',
  },
  {
    title: 'Sales analytics',
    detail: 'Using illustrative sample data',
    time: 'Demo',
    status: 'warning',
  },
]

const statusStyles: Record<Vehicle['status'], string> = {
  active: 'bg-emerald-50 text-emerald-700',
  sold: 'bg-slate-100 text-slate-700',
  in_service: 'bg-amber-50 text-amber-700',
}

const statusLabels: Record<Vehicle['status'], string> = {
  active: 'Active',
  sold: 'Sold',
  in_service: 'In service',
}

function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleCount, setVehicleCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [vehicleForm, setVehicleForm] =
    useState<VehicleForm>(initialVehicleForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  async function loadVehicles(signal?: AbortSignal) {
    setLoading(true)
    setApiError(null)

    try {
      const response = await fetch('http://localhost:3000/api/vehicles', {
        signal,
      })

      if (!response.ok) {
        throw new Error(`API request failed (${response.status})`)
      }

      const data: VehiclesResponse = await response.json()

      setVehicles(data.vehicles)
      setVehicleCount(data.count)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      setApiError(
        'Could not load vehicles. Check that the DataPulse API is running.',
      )
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const timer = window.setTimeout(() => {
      void loadVehicles(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [])

  function updateVehicleForm<K extends keyof VehicleForm>(
    field: K,
    value: VehicleForm[K],
  ) {
    setVehicleForm((current) => ({
      ...current,
      [field]: value,
    }))
    setFormError(null)
    setFormSuccess(null)
  }

  async function handleCreateVehicle(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const vin = vehicleForm.vin.trim().toUpperCase()
    const make = vehicleForm.make.trim()
    const model = vehicleForm.model.trim()
    const modelYear = Number(vehicleForm.model_year)

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      setFormError('Enter a valid 17-character VIN.')
      return
    }

    if (!make || !model) {
      setFormError('Make and model are required.')
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
      const response = await fetch('http://localhost:3000/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vin,
          make,
          model,
          model_year: modelYear,
          status: vehicleForm.status,
        }),
      })

      const data: {
        message?: string
        error?: string
        vehicle?: Vehicle
      } = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create vehicle.')
      }

      setVehicleForm(initialVehicleForm)
      setFormSuccess(
        `${data.vehicle?.make ?? make} ${data.vehicle?.model ?? model} was added successfully.`,
      )
      await loadVehicles()
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Could not create vehicle. Check the API connection.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const metrics = [
    {
      label: 'Vehicles in inventory',
      value: loading && !lastUpdated ? '—' : String(vehicleCount),
      detail: apiError
        ? 'API connection unavailable'
        : 'Records returned by PostgreSQL',
      icon: CarFront,
      trend: apiError ? 'warning' : 'neutral',
    },
    ...demoMetrics,
    {
      label: 'Database API',
      value: apiError ? 'Offline' : loading ? 'Checking' : 'Connected',
      detail: apiError
        ? 'Unable to retrieve vehicle records'
        : 'Data loaded from PostgreSQL',
      icon: ShieldCheck,
      trend: apiError ? 'warning' : 'neutral',
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
            <p className="text-xs text-slate-400">
              Automotive intelligence
            </p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav aria-label="Main navigation" className="space-y-1">
          {navigation.map(({ label, icon: Icon }, index) => (
            <a
              key={label}
              href={
                index === 0
                  ? '#overview'
                  : `#${label.toLowerCase().replaceAll(' ', '-')}`
              }
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
                ? 'Connecting'
                : 'Database connected'}
          </div>
          <p className="text-xs leading-5 text-slate-400">
            {apiError
              ? 'Vehicle data could not be loaded from the backend.'
              : 'Vehicle inventory is retrieved through the DataPulse API.'}
          </p>
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
              Monitor vehicle inventory, sales, and data operations.
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
              Inventory is database-backed; other figures are illustrative.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            Portfolio demo
          </span>
        </div>

        <section
          aria-label="Key performance indicators"
          className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map(({ label, value, detail, icon: Icon, trend }) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  {label}
                </p>
                <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700">
                  <Icon size={20} aria-hidden="true" />
                </div>
              </div>

              <p className="text-2xl font-bold tracking-tight">{value}</p>

              <div className="mt-2 flex items-start gap-1.5">
                {trend === 'up' && (
                  <ArrowUpRight
                    size={15}
                    className="mt-0.5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                )}
                {trend === 'neutral' && (
                  <CircleCheck
                    size={15}
                    className="mt-0.5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                )}
                {trend === 'warning' && (
                  <AlertTriangle
                    size={15}
                    className="mt-0.5 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                )}
                <p className="text-xs leading-5 text-slate-500">{detail}</p>
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
                Vehicle records retrieved from PostgreSQL.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowVehicleForm((current) => !current)
                  setFormError(null)
                  setFormSuccess(null)
                }}
                aria-expanded={showVehicleForm}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
              >
                {showVehicleForm ? <X size={16} /> : <Plus size={16} />}
                {showVehicleForm ? 'Close form' : 'Add vehicle'}
              </button>

              <button
                type="button"
                onClick={() => void loadVehicles()}
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

          {showVehicleForm && (
            <form
              onSubmit={handleCreateVehicle}
              className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5"
            >
              <div className="mb-4">
                <h4 className="font-semibold">Add a vehicle</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the vehicle details to save a new record to PostgreSQL.
                </p>
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
                    name="vin"
                    value={vehicleForm.vin}
                    onChange={(event) =>
                      updateVehicleForm('vin', event.target.value)
                    }
                    placeholder="17-character VIN"
                    maxLength={17}
                    required
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Letters I, O and Q are not allowed.
                  </p>
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
                    name="make"
                    value={vehicleForm.make}
                    onChange={(event) =>
                      updateVehicleForm('make', event.target.value)
                    }
                    placeholder="e.g. Toyota"
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
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
                    name="model"
                    value={vehicleForm.model}
                    onChange={(event) =>
                      updateVehicleForm('model', event.target.value)
                    }
                    placeholder="e.g. Corolla"
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
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
                    name="model_year"
                    type="number"
                    min={1886}
                    max={2100}
                    step={1}
                    value={vehicleForm.model_year}
                    onChange={(event) =>
                      updateVehicleForm('model_year', event.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
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
                    name="status"
                    value={vehicleForm.status}
                    onChange={(event) =>
                      updateVehicleForm(
                        'status',
                        event.target.value as Vehicle['status'],
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
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

              {formSuccess && (
                <p
                  role="status"
                  className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                >
                  {formSuccess}
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
                  {submitting ? 'Saving vehicle...' : 'Save vehicle'}
                </button>
                <p className="text-xs text-slate-500">
                  VINs must be unique. The API validates the submitted data.
                </p>
              </div>
            </form>
          )}

          {apiError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              <p>{apiError}</p>
              <p className="mt-1 text-xs">
                Confirm that the API is running on port 3000, then try again.
              </p>
            </div>
          )}

          {loading && vehicles.length === 0 && !apiError ? (
            <div
              className="flex items-center gap-3 py-12 text-sm text-slate-500"
              role="status"
            >
              <RefreshCw size={18} className="animate-spin" />
              Loading vehicle records...
            </div>
          ) : !apiError && vehicles.length === 0 ? (
            <div className="py-10 text-center">
              <CarFront
                size={30}
                className="mx-auto mb-3 text-slate-400"
              />
              <p className="font-medium">No vehicles found</p>
              <p className="mt-1 text-sm text-slate-500">
                The API returned no vehicle records.
              </p>
            </div>
          ) : vehicles.length > 0 ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>
                  {vehicleCount} {vehicleCount === 1 ? 'vehicle' : 'vehicles'}
                </span>
                <span className="text-slate-300">•</span>
                <span>PostgreSQL inventory</span>
                {lastUpdated && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>Updated at {lastUpdated}</span>
                  </>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
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
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              statusStyles[vehicle.status] ??
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {statusLabels[vehicle.status] ?? vehicle.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          #{vehicle.id}
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
              Source: DataPulse REST API backed by PostgreSQL. The vehicle
              records are synthetic portfolio demo data.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">Sales activity</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Illustrative daily sales volume
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500" />
                Vehicles sold
              </div>
            </div>

            <div
              role="img"
              aria-label="Bar chart showing illustrative daily vehicle sales from Monday to Sunday"
              className="h-64 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} vehicles`, 'Sales']}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="sales"
                    name="Vehicles sold"
                    fill="#06b6d4"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Source: synthetic sample data · Not connected to sales systems
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Recent activity</h3>
              <Activity
                size={18}
                className="text-slate-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Project activity and demo events
            </p>

            <div className="mt-6 space-y-6">
              {recentActivity.map((event) => (
                <div key={event.title} className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    {event.status === 'success' ? (
                      <CircleCheck
                        size={17}
                        className="text-emerald-600"
                        aria-label="Successful event"
                      />
                    ) : (
                      <AlertTriangle
                        size={17}
                        className="text-amber-600"
                        aria-label="Demo event"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.detail}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock size={12} aria-hidden="true" />
                      {event.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-slate-50 p-3">
              <p className="text-xs leading-5 text-slate-500">
                Vehicle inventory is connected to PostgreSQL. Sales analytics
                and operational events remain illustrative demo data.
              </p>
            </div>
          </article>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>DataPulse · Automotive data intelligence</span>
          <span>
            {apiError
              ? 'API connection unavailable'
              : loading
                ? 'Connecting to API...'
                : 'Vehicle inventory connected · Sales data is illustrative'}
          </span>
        </footer>
      </main>
    </div>
  )
}

export default App
