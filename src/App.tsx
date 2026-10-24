
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

const metrics = [
  {
    label: 'Vehicles sold',
    value: '186',
    detail: '+8.2% compared with last month',
    icon: CarFront,
    trend: 'up',
  },
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
    detail: 'Across all service locations',
    icon: Wrench,
    trend: 'up',
  },
  {
    label: 'Data pipeline',
    value: 'Healthy',
    detail: 'Demo status · No live connection',
    icon: ShieldCheck,
    trend: 'neutral',
  },
]

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

const recentActivity = [
  {
    title: 'Vehicle sales imported',
    detail: 'Sales data · Daily import',
    time: '10 min ago',
    status: 'success',
  },
  {
    title: 'Service report generated',
    detail: 'After-sales · Weekly report',
    time: '32 min ago',
    status: 'success',
  },
  {
    title: 'Data quality check completed',
    detail: 'Vehicle inventory · Validation',
    time: '1 hour ago',
    status: 'warning',
  },
]

function App() {
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
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Demo platform
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Interface running. Backend and data integrations are not connected.
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
              Monitor vehicle sales, after-sales service, and data operations.
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
              Illustrative figures for the current month
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Demo data
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
                <p className="text-xs leading-5 text-slate-500">{detail}</p>
              </div>
            </article>
          ))}
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
              Example data operations
            </p>

            <div className="mt-6 space-y-6">
              {recentActivity.map((event) => (
                <div key={event.title} className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    {event.status === 'success' ? (
                      <CircleCheck
                        size={17}
                        className="text-emerald-600"
                        aria-label="Successful example event"
                      />
                    ) : (
                      <AlertTriangle
                        size={17}
                        className="text-amber-600"
                        aria-label="Example validation event"
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
                These events are examples. Live pipeline monitoring will be
                added when the backend integration is implemented.
              </p>
            </div>
          </article>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>DataPulse · Automotive data intelligence</span>
          <span>Demo environment · No live database connection</span>
        </footer>
      </main>
    </div>
  )
}

export default App
