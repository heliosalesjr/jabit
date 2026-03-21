import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Target, BookOpen, Trophy, CheckSquare, LogOut } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { signOut } from '../../firebase/auth'
import { ThemeToggle } from './ThemeToggle'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: Target, label: 'Hábitos' },
  { to: '/todos', icon: CheckSquare, label: 'To-dos' },
  { to: '/journal', icon: BookOpen, label: 'Diário' },
  { to: '/achievements', icon: Trophy, label: 'Conquistas' },
]

export function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
          <span className="text-xl">✨</span>
        </div>
        <div>
          <h1 className="font-black text-slate-900 dark:text-white leading-tight">Jabit</h1>
          <p className="text-xs text-slate-400">hábitos & diário</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all text-sm',
                isActive
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-200 dark:shadow-violet-900/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Tema</span>
          <ThemeToggle />
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <img
              src={user.photoURL ?? ''}
              alt={user.displayName ?? ''}
              className="w-9 h-9 rounded-full ring-2 ring-violet-200 dark:ring-violet-900"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user.displayName?.split(' ')[0]}
              </p>
              <button
                onClick={() => signOut()}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <LogOut size={10} />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
