import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useJournal } from '../hooks/useJournal'
import { upsertJournalEntry } from '../firebase/firestore'
import { getDailyPrompt } from '../data/journalPrompts'
import { getTodayISO } from '../lib/streaks'
import type { JournalEntry } from '../types'

const MOODS = [
  { value: 1, emoji: '😞', label: 'Difícil' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Ok' },
  { value: 4, emoji: '😊', label: 'Bem' },
  { value: 5, emoji: '🤩', label: 'Incrível' },
] as const

function JournalHistoryItem({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div layout className="card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {MOODS.find((m) => m.value === entry.mood)?.emoji ?? '📔'}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {format(parseISO(entry.date), "d 'de' MMMM, yyyy", { locale: ptBR })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {entry.content?.slice(0, 60)}
              {entry.content?.length > 60 ? '...' : ''}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="text-xs font-medium text-violet-500 mb-2 flex items-center gap-1">
                <Sparkles size={10} />
                {entry.promptQuestion}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {entry.content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function JournalPage() {
  const { user } = useAuth()
  const { entries } = useJournal()
  const today = getTodayISO()
  const prompt = getDailyPrompt()

  const todayEntry = entries.find((e) => e.date === today)

  const [content, setContent] = useState(todayEntry?.content ?? '')
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | undefined>(todayEntry?.mood)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (todayEntry) {
      setContent(todayEntry.content ?? '')
      setMood(todayEntry.mood)
    }
  }, [todayEntry?.id])

  const save = useCallback(async () => {
    if (!user || !content.trim()) return
    setSaving(true)
    try {
      await upsertJournalEntry(user.uid, today, {
        promptQuestion: prompt,
        content: content.trim(),
        mood,
      })
    } catch {
      toast.error('Erro ao salvar entrada')
    } finally {
      setSaving(false)
    }
  }, [user, today, prompt, content, mood])

  const pastEntries = entries.filter((e) => e.date !== today)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Meu Diário</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </motion.div>

      {/* Today's prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-6 rounded-3xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500" />
        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-white/80" />
            <span className="text-white/80 text-xs font-semibold uppercase tracking-wide">
              Pergunta do dia
            </span>
          </div>
          <p className="text-white text-lg font-semibold leading-snug">{prompt}</p>
        </div>
      </motion.div>

      {/* Mood selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-4 mb-5"
      >
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Como você está hoje?
        </p>
        <div className="flex justify-between">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                mood === m.value
                  ? 'bg-violet-100 dark:bg-violet-900/30 scale-110'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{m.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Text area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-5"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva o que quiser... sem julgamentos 💭"
          rows={8}
          className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all resize-none leading-relaxed text-sm"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-400">
            {content.length} caracteres
          </span>
          <button
            onClick={save}
            disabled={!content.trim() || saving}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {saving ? 'Salvando...' : todayEntry ? '💾 Atualizar' : '✨ Salvar'}
          </button>
        </div>
      </motion.div>

      {/* Past entries */}
      {pastEntries.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            📚 Entradas anteriores
            <span className="text-sm font-normal text-slate-400">({pastEntries.length})</span>
          </h2>
          <div className="space-y-2">
            {pastEntries.map((entry) => (
              <JournalHistoryItem key={entry.id} entry={entry} />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  )
}
