import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { updateQuickNote } from '../../firebase/firestore'
import { cn } from '../../lib/cn'
import type { QuickNote } from '../../types'

const NOTE_COLORS: Record<string, { bg: string; text: string; placeholder: string }> = {
  yellow:  { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-900 dark:text-amber-100',   placeholder: 'placeholder-amber-400/60 dark:placeholder-amber-500/40' },
  pink:    { bg: 'bg-pink-50 dark:bg-pink-900/20',     text: 'text-pink-900 dark:text-pink-100',     placeholder: 'placeholder-pink-400/60 dark:placeholder-pink-500/40' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-900/20',       text: 'text-sky-900 dark:text-sky-100',       placeholder: 'placeholder-sky-400/60 dark:placeholder-sky-500/40' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-900 dark:text-emerald-100', placeholder: 'placeholder-emerald-400/60 dark:placeholder-emerald-500/40' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-900 dark:text-violet-100', placeholder: 'placeholder-violet-400/60 dark:placeholder-violet-500/40' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-900 dark:text-orange-100', placeholder: 'placeholder-orange-400/60 dark:placeholder-orange-500/40' },
}

const MAX_CHARS = 280

interface QuickNoteBlockProps {
  note: QuickNote
  uid: string
}

export function QuickNoteBlock({ note, uid }: QuickNoteBlockProps) {
  const [content, setContent] = useState(note.content)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const colors = NOTE_COLORS[note.color] ?? NOTE_COLORS.yellow

  // Sync if note changes externally (e.g. after pinning a different note)
  useEffect(() => {
    setContent(note.content)
  }, [note.id])

  const save = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        updateQuickNote(uid, note.id, value)
      }, 700)
    },
    [uid, note.id]
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CHARS)
    setContent(val)
    save(val)
  }

  return (
    <div className={cn('rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col', colors.bg)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h3 className={cn('font-bold text-xs uppercase tracking-wide opacity-60', colors.text)}>
          📝 Nota rápida
        </h3>
        <Link to="/todos" className="opacity-40 hover:opacity-70 transition-opacity">
          <ArrowRight size={13} className={colors.text} />
        </Link>
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Escreva algo rápido..."
        rows={5}
        className={cn(
          'flex-1 w-full px-4 py-2 bg-transparent resize-none outline-none text-sm leading-relaxed',
          colors.text,
          colors.placeholder
        )}
      />

      {/* Char count */}
      <div className={cn('px-4 pb-2 text-right text-[10px] opacity-40', colors.text)}>
        {content.length}/{MAX_CHARS}
      </div>
    </div>
  )
}
