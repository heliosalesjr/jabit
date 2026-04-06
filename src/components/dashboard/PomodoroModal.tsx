import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Configuração das fases ───────────────────────────────────────────────────

type Phase = 'focus' | 'short' | 'long'

const PHASES: Record<Phase, { label: string; minutes: number; color: string; gradient: string; ring: string; xp: number }> = {
  focus: {
    label: 'Foco',
    minutes: 25,
    color: 'text-violet-500',
    gradient: 'from-violet-500 to-fuchsia-500',
    ring: '#8B5CF6',
    xp: 30,
  },
  short: {
    label: 'Pausa',
    minutes: 5,
    color: 'text-cyan-500',
    gradient: 'from-cyan-400 to-blue-500',
    ring: '#06B6D4',
    xp: 0,
  },
  long: {
    label: 'Pausa longa',
    minutes: 15,
    color: 'text-emerald-500',
    gradient: 'from-emerald-400 to-teal-500',
    ring: '#10B981',
    xp: 0,
  },
}

// ─── Ring SVG ─────────────────────────────────────────────────────────────────

function TimerRing({ percent, phase, size = 220 }: { percent: number; phase: Phase; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  const ringId = `pomo-ring-${phase}`

  return (
    <svg width={size} height={size} className="-rotate-90 absolute inset-0">
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth={strokeWidth}
        className="text-slate-100 dark:text-slate-800"
      />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ stroke: `url(#${ringId})`, transition: 'stroke-dashoffset 0.5s ease-out' }}
      />
      <defs>
        <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={PHASES[phase].ring} />
          <stop offset="100%" stopColor={phase === 'focus' ? '#D946EF' : phase === 'short' ? '#3B82F6' : '#14B8A6'} />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface PomodoroModalProps {
  open: boolean
  onClose: () => void
}

export function PomodoroModal({ open, onClose }: PomodoroModalProps) {
  const [phase, setPhase] = useState<Phase>('focus')
  const [timeLeft, setTimeLeft] = useState(PHASES.focus.minutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)   // focus sessions completadas
  const [totalXP, setTotalXP] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = PHASES[phase].minutes * 60
  const percent = ((totalSeconds - timeLeft) / totalSeconds) * 100
  const isFinishing = timeLeft <= 15 && isRunning

  // ─── Timer ───────────────────────────────────────────────────────────────────

  const complete = useCallback(() => {
    setIsRunning(false)
    const cfg = PHASES[phase]

    if (phase === 'focus') {
      const newCount = sessionCount + 1
      setSessionCount(newCount)
      setTotalXP((prev) => prev + cfg.xp)
      toast.success(`Sessão concluída! +${cfg.xp} XP de incubação 🥚`, { duration: 4000, icon: '🎉' })
      // Depois de 4 sessões → pausa longa, senão → pausa curta
      const next: Phase = newCount % 4 === 0 ? 'long' : 'short'
      setPhase(next)
      setTimeLeft(PHASES[next].minutes * 60)
    } else {
      toast('Pausa encerrada. Hora de focar! 💪', { icon: '⏱️' })
      setPhase('focus')
      setTimeLeft(PHASES.focus.minutes * 60)
    }
  }, [phase, sessionCount])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(intervalRef.current!); complete(); return 0 }
          return t - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, complete])

  // Reseta ao fechar
  useEffect(() => {
    if (!open) {
      setIsRunning(false)
    }
  }, [open])

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handlePhaseChange = (p: Phase) => {
    if (isRunning) return
    setPhase(p)
    setTimeLeft(PHASES[p].minutes * 60)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(PHASES[phase].minutes * 60)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  // ─── Egg emoji com animação dinâmica ─────────────────────────────────────────

  const eggVariants = {
    idle: { rotate: 0, y: [0, -4, 0], transition: { y: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } } },
    running: { rotate: [-2, 2, -2], transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } },
    finishing: { rotate: [-12, 12, -10, 10, -8, 8, 0], transition: { repeat: Infinity, duration: 0.4, ease: 'easeInOut' } },
  }

  const eggState = isFinishing ? 'finishing' : isRunning ? 'running' : 'idle'

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${PHASES[phase].gradient} p-5 flex items-center justify-between`}>
              <div>
                <h2 className="text-white font-black text-xl">Pomofocus</h2>
                <p className="text-white/70 text-xs mt-0.5">
                  {sessionCount > 0
                    ? `${sessionCount} sessão${sessionCount !== 1 ? 'ões' : ''} · ${totalXP} XP ganhos`
                    : 'Foque e choque seus ovos'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {/* Mode tabs */}
              <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mb-6 gap-1">
                {(Object.keys(PHASES) as Phase[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePhaseChange(p)}
                    disabled={isRunning}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      phase === p
                        ? `bg-white dark:bg-slate-700 shadow-sm ${PHASES[p].color}`
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:cursor-not-allowed'
                    }`}
                  >
                    {PHASES[p].label}
                  </button>
                ))}
              </div>

              {/* Timer + egg */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-[220px] h-[220px]">
                  <TimerRing percent={percent} phase={phase} />

                  {/* Egg + time (centrado dentro do anel) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <motion.div
                      variants={eggVariants}
                      animate={eggState}
                      className="text-6xl select-none"
                    >
                      🥚
                    </motion.div>
                    <span className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                      {formatTime(timeLeft)}
                    </span>
                    <span className={`text-xs font-semibold ${PHASES[phase].color}`}>
                      {PHASES[phase].label.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* XP por sessão */}
                {phase === 'focus' && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    +{PHASES.focus.xp} XP de incubação ao completar
                  </p>
                )}
              </div>

              {/* Controles */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
                >
                  <RotateCcw size={18} />
                </button>

                <motion.button
                  onClick={() => setIsRunning((r) => !r)}
                  whileTap={{ scale: 0.96 }}
                  className={`flex-1 h-12 rounded-2xl font-bold text-white text-sm shadow-lg transition-all bg-gradient-to-r ${PHASES[phase].gradient} hover:opacity-90 active:scale-95`}
                >
                  {isRunning ? 'Pausar' : timeLeft < totalSeconds ? 'Continuar' : 'Iniciar'}
                </motion.button>
              </div>

              {/* Sessão counter */}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i < (sessionCount % 4)
                        ? `bg-gradient-to-r ${PHASES.focus.gradient}`
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
                <span className="text-xs text-slate-400 ml-1">
                  {sessionCount % 4}/4 → pausa longa
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
