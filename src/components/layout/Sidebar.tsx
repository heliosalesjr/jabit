import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Target, BookOpen, Trophy, CheckSquare, LogOut, Users } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationsContext'
import { signOut } from '../../firebase/auth'
import { ThemeToggle } from './ThemeToggle'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', badge: null as null | 'friends' | 'habits' },
  { to: '/habits', icon: Target, label: 'Hábitos', badge: 'habits' as const },
  { to: '/todos', icon: CheckSquare, label: 'Notas Rápidas', badge: null },
  { to: '/journal', icon: BookOpen, label: 'Diário', badge: null },
  { to: '/friends', icon: Users, label: 'Amigos', badge: 'friends' as const },
  { to: '/achievements', icon: Trophy, label: 'Conquistas', badge: null },
]

export function Sidebar() {
  const { user } = useAuth()
  const { pendingFriendRequests, pendingHabitInvites } = useNotifications()

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
        {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => {
          const count =
            badge === 'friends' ? pendingFriendRequests :
            badge === 'habits' ? pendingHabitInvites : 0

          return (
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
              <div className="relative flex-shrink-0">
                <Icon size={18} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
              {label}
            </NavLink>
          )
        })}
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
