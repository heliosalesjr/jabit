import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Archive, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useHabits } from '../hooks/useHabits'
import { HabitForm } from '../components/habits/HabitForm'
import { Button } from '../components/ui/Button'
import { addHabit, updateHabit, archiveHabit, getAllHabitLogs } from '../firebase/firestore'
import { calculateStreak } from '../lib/streaks'
import type { Habit, HabitLog } from '../types'

export function HabitsPage() {
  const { user } = useAuth()
  const { habits } = useHabits()
  const [showForm, setShowForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [allLogs, setAllLogs] = useState<HabitLog[]>([])

  useEffect(() => {
    if (!user) return
    getAllHabitLogs(user.uid).then(setAllLogs)
  }, [user, habits])

  const getHabitStreak = (habitId: string) => {
    const habitLogs = allLogs.filter((l) => l.habitId === habitId)
    return calculateStreak(habitLogs).current
  }

  const getTotalCompletions = (habitId: string) => {
    return allLogs.filter((l) => l.habitId === habitId).length
  }

  const handleAddHabit = async (data: Parameters<typeof addHabit>[1]) => {
    if (!user) return
    try {
      await addHabit(user.uid, data)
      toast.success('Hábito criado! 🎯')
    } catch {
      toast.error('Erro ao criar hábito')
    }
  }

  const handleEditHabit = async (data: Parameters<typeof addHabit>[1]) => {
    if (!user || !editingHabit) return
    try {
      await updateHabit(user.uid, editingHabit.id, data)
      toast.success('Hábito atualizado!')
      setEditingHabit(null)
    } catch {
      toast.error('Erro ao atualizar hábito')
    }
  }

  const handleArchive = async (habit: Habit) => {
    if (!user) return
    if (!confirm(`Arquivar "${habit.name}"?`)) return
    try {
      await archiveHabit(user.uid, habit.id)
      toast.success('Hábito arquivado')
    } catch {
      toast.error('Erro ao arquivar hábito')
    }
  }

  const frequencyLabel = {
    daily: 'Todo dia',
    weekdays: 'Dias úteis',
    weekends: 'Fins de semana',
    custom: 'Personalizado',
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Meus Hábitos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {habits.length} hábito{habits.length !== 1 ? 's' : ''} ativo{habits.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} size="md">
          <Plus size={16} />
          Novo
        </Button>
      </motion.div>

      {habits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-12 text-center"
        >
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Comece sua jornada!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Crie seu primeiro hábito e comece a construir uma rotina incrível
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Criar primeiro hábito
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit, i) => {
            const streak = getHabitStreak(habit.id)
            const total = getTotalCompletions(habit.id)
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl flex-shrink-0">
                    {habit.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">{habit.name}</h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {frequencyLabel[habit.frequency]}
                      </span>
                      {streak > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                          <Flame size={10} />
                          {streak} dias
                        </span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {total} total
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingHabit(habit)}
                      className="p-2 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleArchive(habit)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <Archive size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <HabitForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleAddHabit}
        habitCount={habits.length}
      />
      {editingHabit && (
        <HabitForm
          open={!!editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={handleEditHabit}
          initial={editingHabit}
          habitCount={habits.length}
        />
      )}
    </div>
  )
}
