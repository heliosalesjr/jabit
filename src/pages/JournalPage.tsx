import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Sparkles, ChevronDown, ChevronUp, PenLine, BookOpen, Search, Pencil, CheckCircle2 } from 'lucide-react'
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

// ─── History Item ─────────────────────────────────────────────────

function JournalHistoryItem({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState(false)
  const mood = MOODS.find((m) => m.value === entry.mood)

  return (
    <motion.div layout className="card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-3"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 flex items-center justify-center text-xl flex-shrink-0">
            {mood?.emoji ?? '📔'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {format(parseISO(entry.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
              {entry.content?.slice(0, 80)}
              {(entry.content?.length ?? 0) > 80 ? '...' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {mood && (
            <span className="text-xs text-slate-400 hidden sm:block">{mood.label}</span>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
              <div className="pt-3 mb-3 flex items-start gap-2">
                <Sparkles size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-violet-500 dark:text-violet-400 italic leading-relaxed">
                  {entry.promptQuestion}
                </p>
              </div>
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

// ─── Main Page ────────────────────────────────────────────────────

type Tab = 'today' | 'history'

export function JournalPage() {
  const { user } = useAuth()
  const { entries, loading } = useJournal()
  const today = getTodayISO()
  const prompt = getDailyPrompt()

  const todayEntry = entries.find((e) => e.date === today)

  const [tab, setTab] = useState<Tab>('today')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')

  // Track if Firestore data has been loaded into the form yet
  const initializedRef = useRef(false)

  useEffect(() => {
    if (loading) return
    if (!initializedRef.current) {
      initializedRef.current = true
      if (todayEntry) {
        setContent(todayEntry.content ?? '')
        setMood(todayEntry.mood)
        setSaved(true)
      }
    }
  }, [loading, todayEntry])

  const save = useCallback(async () => {
    if (!user || !content.trim()) return
    setSaving(true)
    try {
      await upsertJournalEntry(user.uid, today, {
        promptQuestion: prompt,
        content: content.trim(),
        ...(mood !== undefined && { mood }),
      }, todayEntry?.id)
      toast.success(todayEntry ? 'Entrada atualizada! ✅' : 'Entrada salva! ✨')
      setSaved(true)
    } catch (err) {
      console.error('Journal save error:', err)
      toast.error('Erro ao salvar entrada')
    } finally {
      setSaving(false)
    }
  }, [user, today, prompt, content, mood, todayEntry])

  const pastEntries = entries.filter((e) => e.date !== today)

  const filteredEntries = search.trim()
    ? pastEntries.filter(
        (e) =>
          e.content?.toLowerCase().includes(search.toLowerCase()) ||
          e.promptQuestion?.toLowerCase().includes(search.toLowerCase())
      )
    : pastEntries

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Meu Diário</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1"
      >
        <button
          onClick={() => setTab('today')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'today'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <PenLine size={15} />
          Escrever hoje
          {todayEntry && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          )}
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'history'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <BookOpen size={15} />
          Histórico
          {pastEntries.length > 0 && (
            <span className="bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pastEntries.length}
            </span>
          )}
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── TODAY TAB ── */}
        {tab === 'today' && (
          <motion.div
            key="today"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            <AnimatePresence mode="wait">
              {saved ? (
                /* ── SAVED / READ-ONLY VIEW ── */
                <motion.div
                  key="saved-view"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Success banner */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <CheckCircle2 size={18} />
                      <span className="text-sm font-semibold">Entrada de hoje salva</span>
                    </div>
                    <button
                      onClick={() => setSaved(false)}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                    >
                      <Pencil size={13} />
                      Editar
                    </button>
                  </div>

                  {/* Mood display */}
                  {mood !== undefined && (
                    <div className="flex items-center gap-3 card px-4 py-3 mb-4">
                      <span className="text-3xl">{MOODS.find((m) => m.value === mood)?.emoji}</span>
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Humor de hoje</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                          {MOODS.find((m) => m.value === mood)?.label}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Prompt */}
                  <div className="flex items-start gap-2 mb-3 px-1">
                    <Sparkles size={13} className="text-violet-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-violet-500 dark:text-violet-400 italic leading-relaxed">
                      {prompt}
                    </p>
                  </div>

                  {/* Content card */}
                  <div className="card px-5 py-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {content}
                    </p>
                  </div>

                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
                    {content.length} caracteres
                  </p>
                </motion.div>
              ) : (
                /* ── EDIT / WRITE VIEW ── */
                <motion.div
                  key="edit-view"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Prompt */}
                  <div className="relative mb-5 rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500" />
                    <div className="relative p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-white/80" />
                        <span className="text-white/80 text-xs font-semibold uppercase tracking-wide">
                          Pergunta do dia
                        </span>
                      </div>
                      <p className="text-white text-base font-semibold leading-snug">{prompt}</p>
                    </div>
                  </div>

                  {/* Mood selector */}
                  <div className="card p-4 mb-4">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Como você está hoje?
                    </p>
                    <div className="flex justify-between">
                      {MOODS.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => setMood(mood === m.value ? undefined : m.value)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                            mood === m.value
                              ? 'bg-violet-100 dark:bg-violet-900/40 scale-110'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-2xl">{m.emoji}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="mb-4">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Escreva o que quiser... sem julgamentos 💭"
                      rows={9}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all resize-none leading-relaxed text-sm"
                    />
                    <div className="flex items-center justify-between mt-2 px-1">
                      <span className="text-xs text-slate-400">{content.length} caracteres</span>
                      <button
                        onClick={save}
                        disabled={!content.trim() || saving}
                        className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Salvando...' : todayEntry ? '💾 Atualizar' : '✨ Salvar'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="card p-3 text-center">
                <p className="text-2xl font-black text-violet-500">{entries.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">entradas</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-black text-fuchsia-500">
                  {entries.reduce((sum, e) => sum + (e.content?.length ?? 0), 0) > 999
                    ? `${Math.round(entries.reduce((sum, e) => sum + (e.content?.length ?? 0), 0) / 1000)}k`
                    : entries.reduce((sum, e) => sum + (e.content?.length ?? 0), 0)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">chars</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-2xl font-black text-amber-500">
                  {entries.filter((e) => e.mood === 4 || e.mood === 5).length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">dias 😊+</p>
              </div>
            </div>

            {/* Search */}
            {pastEntries.length > 2 && (
              <div className="relative mb-4">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar nas entradas..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all text-sm"
                />
              </div>
            )}

            {/* Today's entry in history */}
            {todayEntry && tab === 'history' && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-2 px-1">
                  Hoje
                </p>
                <JournalHistoryItem entry={todayEntry} />
              </div>
            )}

            {/* Past entries */}
            {filteredEntries.length === 0 ? (
              <div className="card p-10 text-center">
                {search ? (
                  <>
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      Nenhuma entrada encontrada
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Tente outros termos de busca
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      Sem entradas anteriores ainda
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Escreva hoje e comece seu histórico!
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div>
                {!todayEntry && (
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 px-1">
                    Anteriores
                  </p>
                )}
                {todayEntry && filteredEntries.length > 0 && (
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 px-1">
                    Anteriores
                  </p>
                )}
                <div className="space-y-2">
                  {filteredEntries.map((entry) => (
                    <JournalHistoryItem key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
