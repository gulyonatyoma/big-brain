import { NavLink } from 'react-router-dom'
import { navigationItems } from '../../shared/constants/navigation'

function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-white/10 bg-black/25 px-4 py-6 backdrop-blur-xl lg:block">
      <div className="mb-8 px-3">
        <p className="text-sm font-medium text-violet-300">Большой мозг</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
          Productivity
        </h1>
      </div>

      <nav className="flex flex-col gap-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              [
                'rounded-2xl px-4 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            {item.title}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar