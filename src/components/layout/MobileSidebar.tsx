import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { navigationItems } from '../../shared/constants/navigation'

function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div>
          <p className="text-xs font-medium text-violet-300">Большой мозг</p>
          <p className="text-lg font-bold text-white">Productivity</p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          Меню
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <aside className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col border-r border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/60">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-violet-300">
                  Большой мозг
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
                  Productivity
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
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
        </div>
      ) : null}
    </>
  )
}

export default MobileSidebar