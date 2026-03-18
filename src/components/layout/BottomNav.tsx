import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Target, BookOpen, Trophy } from 'lucide-react'
import { cn } from '../../lib/cn'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Hoje' },
  { to: '/habits', icon: Target, label: 'Hábitos' },
  { to: '/journal', icon: BookOpen, label: 'Diário' },
  { to: '/achievements', icon: Trophy, label: 'Conquistas' },
]

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-2 py-2 safe-area-inset-bottom z-40">
      <div className="flex justify-around">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all text-xs font-medium',
                isActive
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-slate-400 dark:text-slate-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'p-2 rounded-xl transition-all',
                    isActive ? 'bg-violet-100 dark:bg-violet-900/30' : ''
                  )}
                >
                  <Icon size={20} />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
