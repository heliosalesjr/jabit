import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Target, BookOpen, Trophy, Users } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useNotifications } from '../../context/NotificationsContext'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Hoje', badge: null as null | 'friends' | 'habits' },
  { to: '/habits', icon: Target, label: 'Hábitos', badge: 'habits' as const },
  { to: '/journal', icon: BookOpen, label: 'Diário', badge: null },
  { to: '/friends', icon: Users, label: 'Amigos', badge: 'friends' as const },
  { to: '/achievements', icon: Trophy, label: 'Conquistas', badge: null },
]

export function BottomNav() {
  const { pendingFriendRequests, pendingHabitInvites } = useNotifications()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-2 py-2 safe-area-inset-bottom z-40">
      <div className="flex justify-around">
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
                      'relative p-2 rounded-xl transition-all',
                      isActive ? 'bg-violet-100 dark:bg-violet-900/30' : ''
                    )}
                  >
                    <Icon size={20} />
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
