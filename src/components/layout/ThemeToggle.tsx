import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { motion } from 'framer-motion'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-6 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors duration-300 flex items-center"
      aria-label="Alternar tema"
    >
      <motion.div
        animate={{ x: theme === 'dark' ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center"
      >
        {theme === 'dark' ? (
          <Moon size={10} className="text-violet-500" />
        ) : (
          <Sun size={10} className="text-amber-500" />
        )}
      </motion.div>
    </button>
  )
}
