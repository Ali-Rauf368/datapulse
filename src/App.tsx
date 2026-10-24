
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  Database,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'

const metrics = [
  { label: 'Total data sources', value: '24', detail: '+3 this month', icon: Database },
  { label: 'Successful runs', value: '1,284', detail: '98.6% success rate', icon: Activity },
  { label: 'Active users', value: '42', detail: 'Across 6 departments', icon: Users },
  { label: 'System health', value: 'Healthy', detail: 'All services operational', icon: ShieldCheck },
]

const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Data sources', icon: Database },
  { label: 'Processing runs', icon: Activity },
  { label: 'Analytics', icon: ChartNoAxesCombined },
  { label: 'Users & roles', icon: Users },
  { label: 'Settings', icon: Settings },
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
            <p className="text-xs text-slate-400">Data intelligence</p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map(({ label, icon: Icon }, index) => (
            <a
              key={label}
              href="#"
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${
                index === 0
                  ? 'bg-cyan-400/15 font-semibold text-cyan-300'
                  : 'text-slate-300 hover:bg-slate-800'
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
            Platform status
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Your dashboard interface is running.
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm text-slate-500">Workspace / Overview</p>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Welcome to your enterprise data monitoring workspace.
            </p>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-100"
          >
            <Bell size={20} />
          </button>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, detail, icon: Icon }) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700">
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              <p className="mt-2 text-xs text-slate-500">{detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-6">
              <h3 className="font-semibold">Processing activity</h3>
              <p className="mt-1 text-sm text-slate-500">
                Sample processing volume over the past week
              </p>
            </div>

            <div className="flex h-56 items-end gap-3 border-b border-slate-100 pb-2 sm:gap-5">
              {[42, 65, 51, 80, 58, 92, 72].map((height, index) => (
                <div key={index} className="flex h-full flex-1 flex-col justify-end">
                  <div
                    className="w-full rounded-t-md bg-cyan-500 transition-colors hover:bg-cyan-400"
                    style={{ height: `${height}%` }}
                    title={`Sample activity: ${height}`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-between text-xs text-slate-400">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Recent activity</h3>
            <p className="mt-1 text-sm text-slate-500">Example events</p>

            <div className="mt-6 space-y-6">
              {[
                { title: 'Data source connected', detail: 'Customer analytics', time: '10 min ago', color: 'bg-emerald-500' },
                { title: 'Processing completed', detail: 'Daily import pipeline', time: '32 min ago', color: 'bg-cyan-500' },
                { title: 'Report generated', detail: 'Operations summary', time: '1 hour ago', color: 'bg-violet-500' },
              ].map((event) => (
                <div key={event.title} className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${event.color}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{event.detail}</p>
                    <p className="mt-2 text-xs text-slate-400">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>DataPulse · Enterprise Data Intelligence</span>
          <span>Demo data · Not connected to the database yet</span>
        </footer>
      </main>
    </div>
  )
}

export default App
