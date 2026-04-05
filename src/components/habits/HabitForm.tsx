import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar'
import type { Habit, HabitColor } from '../../types'

const EMOJIS = ['🏃', '💪', '📚', '🧘', '💧', '🥗', '😴', '🎸', '✍️', '🧹', '🎯', '🌿', '💊', '🚴', '🎨', '🧠', '🙏', '☀️', '🐕', '💻']
const COLORS: HabitColor[] = ['violet', 'fuchsia', 'pink', 'amber', 'emerald', 'sky', 'coral', 'rose', 'teal']

const colorLabels: Record<HabitColor, string> = {
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

const DAYS = [
  { value: 0, label: 'D' },
  { value: 1, label: 'S' },
  { value: 2, label: 'T' },
  { value: 3, label: 'Q' },
  { value: 4, label: 'Q' },
  { value: 5, label: 'S' },
  { value: 6, label: 'S' },
]

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
  const [customDays, setCustomDays] = useState<number[]>(initial?.customDays ?? [1, 2, 3, 4, 5])
  const [showTimeWindow, setShowTimeWindow] = useState(!!initial?.timeWindow)
  const [timeStart, setTimeStart] = useState(initial?.timeWindow?.start ?? '08:00')
  const [timeEnd, setTimeEnd] = useState(initial?.timeWindow?.end ?? '09:00')
  const [calSync, setCalSync] = useState(initial?.googleCalendarSync ?? false)

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  const handleCalSyncToggle = async () => {
    if (calSync) {
      setCalSync(false)
      return
    }
    if (calConnected) {
      setCalSync(true)
      return
    }
    // Not connected yet — trigger the OAuth flow
    const ok = await connectCal()
    if (ok) setCalSync(true)
  }

  const handleSave = () => {
    if (!name.trim()) return
    if (frequency === 'custom' && customDays.length === 0) return

    onSave({
      name: name.trim(),
      emoji,
      color,
      frequency,
      customDays: frequency === 'custom' ? customDays : undefined,
      timeWindow: showTimeWindow ? { start: timeStart, end: timeEnd } : undefined,
      googleCalendarSync: calSync,
      googleCalendarEventId: initial?.googleCalendarEventId,
      targetCount: 1,
      order: habitCount,
    })
    setName('')
    setEmoji('🎯')
    setColor('violet')
    setFrequency('daily')
    setCustomDays([1, 2, 3, 4, 5])
    setShowTimeWindow(false)
    setTimeStart('08:00')
    setTimeEnd('09:00')
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
                onClick={() => setColor(c)}
                className={cn(
                  'w-8 h-8 rounded-full transition-all hover:scale-110',
                  colorLabels[c],
                  color === c && 'ring-3 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110'
                )}
                style={color === c ? { boxShadow: '0 0 0 3px currentColor' } : {}}
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

        {/* Custom days */}
        {frequency === 'custom' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Dias da semana
            </label>
            <div className="flex gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  className={cn(
                    'flex-1 h-9 rounded-xl text-xs font-bold transition-all',
                    customDays.includes(d.value)
                      ? 'bg-gradient-to-b from-violet-500 to-fuchsia-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {customDays.length === 0 && (
              <p className="text-xs text-rose-500 mt-1">Selecione ao menos um dia.</p>
            )}
          </div>
        )}

        {/* Time window */}
        <div>
          <button
            type="button"
            onClick={() => setShowTimeWindow((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            <span
              className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                showTimeWindow
                  ? 'bg-violet-500 border-violet-500 text-white'
                  : 'border-slate-300 dark:border-slate-600'
              )}
            >
              {showTimeWindow && (
                <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            Definir janela de horário
          </button>

          {showTimeWindow && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Início</label>
                <input
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <span className="text-slate-400 mt-4">→</span>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Fim</label>
                <input
                  type="time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
          )}
        </div>

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
                'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
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

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || (frequency === 'custom' && customDays.length === 0)}
            className="flex-1"
          >
            {initial?.id ? 'Salvar' : 'Criar hábito'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
