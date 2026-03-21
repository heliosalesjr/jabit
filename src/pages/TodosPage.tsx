import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Star, Archive, Trash2, Pencil, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useTodoLists } from '../hooks/useTodoLists'
import { useQuickNotes } from '../hooks/useQuickNotes'
import {
  createTodoList, updateTodoListItems, renameTodoList,
  starTodoList, unstarTodoList, archiveTodoList, deleteTodoList,
  createQuickNote, updateQuickNote, updateQuickNoteColor,
  pinQuickNote, unpinQuickNote, archiveQuickNote, deleteQuickNote,
} from '../firebase/firestore'
import { cn } from '../lib/cn'
import type { TodoList, TodoItem, QuickNote, NoteColor } from '../types'

const MAX_CHARS = 280

// ─── Note colors ──────────────────────────────────────────────────

const NOTE_COLOR_OPTIONS: { value: NoteColor; bg: string; ring: string }[] = [
  { value: 'yellow',  bg: 'bg-amber-300',   ring: 'ring-amber-400' },
  { value: 'pink',    bg: 'bg-pink-300',    ring: 'ring-pink-400' },
  { value: 'sky',     bg: 'bg-sky-300',     ring: 'ring-sky-400' },
  { value: 'emerald', bg: 'bg-emerald-300', ring: 'ring-emerald-400' },
  { value: 'violet',  bg: 'bg-violet-300',  ring: 'ring-violet-400' },
  { value: 'orange',  bg: 'bg-orange-300',  ring: 'ring-orange-400' },
]

const NOTE_STYLES: Record<NoteColor, { bg: string; text: string; border: string }> = {
  yellow:  { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-900 dark:text-amber-100',     border: 'border-amber-200 dark:border-amber-800' },
  pink:    { bg: 'bg-pink-50 dark:bg-pink-900/20',       text: 'text-pink-900 dark:text-pink-100',       border: 'border-pink-200 dark:border-pink-800' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-900/20',         text: 'text-sky-900 dark:text-sky-100',         border: 'border-sky-200 dark:border-sky-800' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-900 dark:text-emerald-100', border: 'border-emerald-200 dark:border-emerald-800' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-900/20',   text: 'text-violet-900 dark:text-violet-100',   border: 'border-violet-200 dark:border-violet-800' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-900/20',   text: 'text-orange-900 dark:text-orange-100',   border: 'border-orange-200 dark:border-orange-800' },
}

// ─── Note Card ────────────────────────────────────────────────────

function NoteCard({ note, allNoteIds }: { note: QuickNote; allNoteIds: string[] }) {
  const { user } = useAuth()
  const [content, setContent] = useState(note.content)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const style = NOTE_STYLES[note.color] ?? NOTE_STYLES.yellow

  useEffect(() => { setContent(note.content) }, [note.id])

  const save = useCallback((val: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (user) updateQuickNote(user.uid, note.id, val)
    }, 700)
  }, [user, note.id])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CHARS)
    setContent(val)
    save(val)
  }

  const handleStar = async () => {
    if (!user) return
    if (note.pinned) {
      await unpinQuickNote(user.uid, note.id)
    } else {
      await pinQuickNote(user.uid, note.id, allNoteIds)
      toast('Nota aparecerá no dashboard ⭐')
    }
  }

  const handleArchive = async () => {
    if (!user) return
    await archiveQuickNote(user.uid, note.id)
    toast.success('Nota arquivada')
  }

  const handleDelete = async () => {
    if (!user || !confirm('Deletar esta nota permanentemente?')) return
    await deleteQuickNote(user.uid, note.id)
    toast.success('Nota deletada')
  }

  const handleColor = async (color: NoteColor) => {
    if (!user) return
    await updateQuickNoteColor(user.uid, note.id, color)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('rounded-2xl border p-4 flex flex-col gap-2', style.bg, style.border,
        note.pinned && 'ring-2 ring-amber-400 dark:ring-amber-500'
      )}
    >
      {/* Header row — same pattern as TodoListCard */}
      <div className="flex items-center gap-2">
        {/* Color picker + star indicator */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {note.pinned && <Star size={13} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
          <div className="flex gap-1.5">
            {NOTE_COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleColor(c.value)}
                className={cn(
                  'w-4 h-4 rounded-full transition-all hover:scale-110',
                  c.bg,
                  note.color === c.value && `ring-2 ring-offset-1 ${c.ring} scale-110`
                )}
              />
            ))}
          </div>
        </div>
        {/* Star + Archive + Delete */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleStar}
            title={note.pinned ? 'Remover do dashboard' : 'Mostrar no dashboard'}
            className={cn('p-1.5 rounded-lg transition-all',
              note.pinned ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
            )}
          >
            <Star size={15} className={note.pinned ? 'fill-amber-400' : ''} />
          </button>
          <button
            onClick={handleArchive}
            title="Arquivar nota"
            className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-all"
          >
            <Archive size={15} />
          </button>
          <button
            onClick={handleDelete}
            title="Deletar nota"
            className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-400 transition-all"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Escreva algo..."
        rows={4}
        className={cn(
          'w-full bg-transparent resize-none outline-none text-sm leading-relaxed',
          style.text, 'placeholder-current opacity-100'
        )}
        style={{ opacity: content ? 1 : 0.4 }}
      />

      {/* Char count */}
      <p className={cn('text-right text-[10px] opacity-40', style.text)}>
        {content.length}/{MAX_CHARS}
      </p>
    </motion.div>
  )
}

// ─── Todo List Card ───────────────────────────────────────────────

function TodoListCard({ list, allListIds }: { list: TodoList; allListIds: string[] }) {
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(list.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleToggleItem = async (itemId: string) => {
    if (!user) return
    const updated = list.items.map((i) => i.id === itemId ? { ...i, done: !i.done } : i)
    await updateTodoListItems(user.uid, list.id, updated)
  }

  const handleAddItem = async (text: string) => {
    if (!user || !text.trim()) return
    const newItem: TodoItem = { id: Math.random().toString(36).slice(2, 10), text: text.trim(), done: false }
    await updateTodoListItems(user.uid, list.id, [...list.items, newItem])
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return
    await updateTodoListItems(user.uid, list.id, list.items.filter((i) => i.id !== itemId))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && draft.trim()) { handleAddItem(draft.trim()); setDraft('') }
  }

  const handleSaveName = async () => {
    if (!user || !nameValue.trim()) return
    await renameTodoList(user.uid, list.id, nameValue.trim())
    setEditingName(false)
  }

  const handleStar = async () => {
    if (!user) return
    if (list.starred) { await unstarTodoList(user.uid, list.id) }
    else { await starTodoList(user.uid, list.id, allListIds); toast('Lista aparecerá no dashboard ⭐') }
  }

  const pending = list.items.filter((i) => !i.done)
  const done = list.items.filter((i) => i.done)

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={cn('card p-5', list.starred && 'ring-2 ring-amber-400 dark:ring-amber-500')}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input autoFocus value={nameValue} onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
              className="flex-1 text-sm font-bold bg-transparent border-b-2 border-violet-400 text-slate-900 dark:text-white outline-none pb-0.5"
            />
            <button onClick={handleSaveName} className="text-emerald-500"><Check size={15} /></button>
            <button onClick={() => setEditingName(false)} className="text-slate-400"><X size={15} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {list.starred && <Star size={13} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
            <h3 className="font-bold text-slate-900 dark:text-white truncate">{list.name}</h3>
            <button onClick={() => setEditingName(true)} className="text-slate-300 dark:text-slate-600 hover:text-slate-500 flex-shrink-0">
              <Pencil size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={handleStar} title={list.starred ? 'Remover do dashboard' : 'Mostrar no dashboard'}
            className={cn('p-1.5 rounded-lg transition-all', list.starred ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400')}
          >
            <Star size={15} className={list.starred ? 'fill-amber-400' : ''} />
          </button>
          <button onClick={async () => { if (user) { await archiveTodoList(user.uid, list.id); toast.success('Arquivada') } }}
            className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-all"><Archive size={15} /></button>
          <button onClick={async () => { if (user && confirm(`Deletar "${list.name}"?`)) { await deleteTodoList(user.uid, list.id); toast.success('Deletada') } }}
            className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 transition-all"><Trash2 size={15} /></button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-3">
        <AnimatePresence initial={false}>
          {[...pending, ...done].map((item) => (
            <motion.div key={item.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 group"
            >
              <button onClick={() => handleToggleItem(item.id)}
                className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  item.done ? 'bg-violet-500 border-violet-500' : 'border-slate-300 dark:border-slate-600 hover:border-violet-400'
                )}
              >
                {item.done && <svg viewBox="0 0 10 10" className="w-3 h-3 text-white" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
              <span className={cn('text-sm flex-1 transition-all', item.done ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300')}>
                {item.text}
              </span>
              <button onClick={() => handleDeleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all">
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add input */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button onClick={() => { if (draft.trim()) { handleAddItem(draft.trim()); setDraft('') } else inputRef.current?.focus() }}
          className="w-5 h-5 rounded-md border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0 hover:border-violet-400 transition-colors"
        >
          <Plus size={10} className="text-slate-400" />
        </button>
        <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Digite aqui..." className="flex-1 text-sm bg-transparent text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 outline-none"
        />
      </div>
      {list.items.length > 0 && (
        <p className="text-xs text-slate-400 mt-2">{done.length}/{list.items.length} concluídas</p>
      )}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────

export function TodosPage() {
  const { user } = useAuth()
  const { lists } = useTodoLists()
  const { notes } = useQuickNotes()
  const [creatingList, setCreatingList] = useState(false)
  const [newListName, setNewListName] = useState('')

  const handleCreateList = async () => {
    if (!user || !newListName.trim()) return
    await createTodoList(user.uid, newListName.trim())
    toast.success('Lista criada!')
    setNewListName('')
    setCreatingList(false)
  }

  const handleCreateNote = async () => {
    if (!user) return
    const colors: NoteColor[] = ['yellow', 'pink', 'sky', 'emerald', 'violet', 'orange']
    const color = colors[notes.length % colors.length]
    await createQuickNote(user.uid, color)
  }

  const allListIds = lists.map((l) => l.id)
  const allNoteIds = notes.map((n) => n.id)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* ── To-do Lists ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">To-dos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {lists.length} lista{lists.length !== 1 ? 's' : ''} ativa{lists.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setCreatingList(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nova lista
        </button>
      </motion.div>

      <AnimatePresence>
        {creatingList && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card p-4 mb-4 flex items-center gap-3"
          >
            <input autoFocus value={newListName} onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateList(); if (e.key === 'Escape') { setCreatingList(false); setNewListName('') } }}
              placeholder="Nome da lista..." className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none font-semibold"
            />
            <button onClick={handleCreateList} disabled={!newListName.trim()} className="btn-primary text-sm disabled:opacity-40">Criar</button>
            <button onClick={() => { setCreatingList(false); setNewListName('') }} className="btn-ghost text-sm">Cancelar</button>
          </motion.div>
        )}
      </AnimatePresence>

      {lists.length === 0 && !creatingList ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-10 text-center mb-8">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-bold text-slate-900 dark:text-white mb-1">Nenhuma lista ainda</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Crie sua primeira lista de tarefas</p>
          <button onClick={() => setCreatingList(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Criar lista
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4 mb-10">
          {lists.map((list) => <TodoListCard key={list.id} list={list} allListIds={allListIds} />)}
        </div>
      )}

      {/* ── Quick Notes ── */}
      <div className="flex items-center justify-between mb-5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Notas rápidas</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">
            Máximo {MAX_CHARS} caracteres por nota
          </p>
        </div>
        <button onClick={handleCreateNote} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nova nota
        </button>
      </div>

      {notes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-10 text-center">
          <div className="text-5xl mb-3">📝</div>
          <p className="font-bold text-slate-900 dark:text-white mb-1">Nenhuma nota ainda</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Para pensamentos rápidos e lembretes</p>
          <button onClick={handleCreateNote} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Criar nota
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {notes.map((note) => <NoteCard key={note.id} note={note} allNoteIds={allNoteIds} />)}
        </div>
      )}
    </div>
  )
}
