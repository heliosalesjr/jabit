import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar'
import { HabitCalendarPicker } from './HabitCalendarPicker'
import type { Habit, HabitColor } from '../../types'

const EMOJIS = ['🏃', '💪', '📚', '🧘', '💧', '🥗', '😴', '🎸', '✍️', '🧹', '🎯', '🌿', '💊', '🚴', '🎨', '🧠', '🙏', '☀️', '🐕', '💻']
const COLORS: HabitColor[] = ['violet', 'fuchsia', 'pink', 'amber', 'emerald', 'sky', 'coral', 'rose', 'teal']

const colorDot: Record<HabitColor, string> = {
  violet: 'bg-violet-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  coral: 'bg-orange-500',
  rose: 'bg-rose-500',
  teal: 'bg-teal-500',
}

const FREQUENCIES = [
  { value: 'daily', label: 'Todo dia' },
  { value: 'weekdays', label: 'Dias úteis' },
  { value: 'weekends', label: 'Fins de semana' },
  { value: 'custom', label: 'Personalizado' },
] as const

interface HabitFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Habit, 'id' | 'createdAt'>) => void
  initial?: Partial<Habit>
  habitCount: number
}

export function HabitForm({ open, onClose, onSave, initial, habitCount }: HabitFormProps) {
  const { connected: calConnected, connecting: calConnecting, connect: connectCal } = useGoogleCalendar()

  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🎯')
  const [color, setColor] = useState<HabitColor>(initial?.color ?? 'violet')
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>(
    initial?.frequency ?? 'daily'
  )
  const [specificDates, setSpecificDates] = useState<string[]>(initial?.specificDates ?? [])
  const [calSync, setCalSync] = useState(initial?.googleCalendarSync ?? false)

  const handleCalSyncToggle = async () => {
    if (calSync) { setCalSync(false); return }
    if (calConnected) { setCalSync(true); return }
    const ok = await connectCal()
    if (ok) setCalSync(true)
  }

  const canSave = name.trim().length > 0 && (frequency !== 'custom' || specificDates.length > 0)

  const handleSave = () => {
    if (!canSave) return
    const data: Omit<Habit, 'id' | 'createdAt'> = {
      name: name.trim(),
      emoji,
      color,
      frequency,
      targetCount: 1,
      order: habitCount,
    }
    if (frequency === 'custom') data.specificDates = specificDates
    if (calSync) data.googleCalendarSync = true
    if (initial?.googleCalendarEventId) data.googleCalendarEventId = initial.googleCalendarEventId
    onSave(data)
    // Reset
    setName('')
    setEmoji('🎯')
    setColor('violet')
    setFrequency('daily')
    setSpecificDates([])
    setCalSync(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? 'Editar hábito' : 'Novo hábito'}>
      <div className="space-y-5">

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Nome do hábito
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Beber 2L de água"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>

        {/* Emoji */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Emoji
          </label>
          <div className="grid grid-cols-10 gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={cn(
                  'w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all hover:scale-110',
                  emoji === e
                    ? 'bg-violet-100 dark:bg-violet-900/50 ring-2 ring-violet-400 scale-110'
                    : 'bg-slate-100 dark:bg-slate-800'
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Cor
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'w-8 h-8 rounded-full transition-all hover:scale-110',
                  colorDot[c],
                  color === c && 'scale-110'
                )}
                style={color === c ? { boxShadow: '0 0 0 3px white, 0 0 0 5px currentColor' } : {}}
              />
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Frequência
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCIES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFrequency(f.value)}
                className={cn(
                  'py-2 px-3 rounded-xl text-sm font-medium transition-all',
                  frequency === f.value
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar picker for custom frequency */}
        {frequency === 'custom' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
            <HabitCalendarPicker
              selectedDates={specificDates}
              onChange={setSpecificDates}
              color={color}
            />
            {specificDates.length === 0 && (
              <p className="text-xs text-rose-500 mt-2">Selecione ao menos um dia.</p>
            )}
          </div>
        )}

        {/* Google Calendar sync */}
        <div>
          <button
            type="button"
            onClick={handleCalSyncToggle}
            disabled={calConnecting}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50"
          >
            <span
              className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                calSync
                  ? 'bg-violet-500 border-violet-500 text-white'
                  : 'border-slate-300 dark:border-slate-600'
              )}
            >
              {calSync && (
                <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            {calConnecting ? 'Conectando...' : 'Sincronizar com Google Calendar'}
          </button>
          {!calConnected && !calSync && (
            <p className="text-xs text-slate-400 mt-1 ml-6">
              Ao ativar, você autoriza o acesso ao seu calendário.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave} className="flex-1">
            {initial?.id ? 'Salvar' : 'Criar hábito'}
          </Button>
        </div>

      </div>
    </Modal>
  )
}
