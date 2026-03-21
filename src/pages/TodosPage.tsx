import { useState, useRef, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Star, Archive, Trash2, Pencil, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useTodoLists } from '../hooks/useTodoLists'
import {
  createTodoList,
  updateTodoListItems,
  renameTodoList,
  starTodoList,
  unstarTodoList,
  archiveTodoList,
  deleteTodoList,
} from '../firebase/firestore'
import { cn } from '../lib/cn'
import type { TodoList, TodoItem } from '../types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Single list card ─────────────────────────────────────────────

function TodoListCard({
  list,
  allListIds,
  onStar,
}: {
  list: TodoList
  allListIds: string[]
  onStar: () => void
}) {
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(list.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleToggleItem = async (itemId: string) => {
    if (!user) return
    const updated = list.items.map((i) =>
      i.id === itemId ? { ...i, done: !i.done } : i
    )
    await updateTodoListItems(user.uid, list.id, updated)
  }

  const handleAddItem = async (text: string) => {
    if (!user || !text.trim()) return
    const newItem: TodoItem = { id: generateId(), text: text.trim(), done: false }
    await updateTodoListItems(user.uid, list.id, [...list.items, newItem])
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return
    await updateTodoListItems(user.uid, list.id, list.items.filter((i) => i.id !== itemId))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && draft.trim()) {
      handleAddItem(draft.trim())
      setDraft('')
    }
  }

  const handleSaveName = async () => {
    if (!user || !nameValue.trim()) return
    await renameTodoList(user.uid, list.id, nameValue.trim())
    setEditingName(false)
  }

  const handleArchive = async () => {
    if (!user) return
    await archiveTodoList(user.uid, list.id)
    toast.success('Lista arquivada')
  }

  const handleDelete = async () => {
    if (!user) return
    if (!confirm(`Deletar "${list.name}" permanentemente?`)) return
    await deleteTodoList(user.uid, list.id)
    toast.success('Lista deletada')
  }

  const handleStar = async () => {
    if (!user) return
    if (list.starred) {
      await unstarTodoList(user.uid, list.id)
    } else {
      await starTodoList(user.uid, list.id, allListIds)
      toast('Esta lista aparecerá no dashboard ⭐', { icon: '⭐' })
    }
    onStar()
  }

  const pending = list.items.filter((i) => !i.done)
  const done = list.items.filter((i) => i.done)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'card p-5 transition-all',
        list.starred && 'ring-2 ring-amber-400 dark:ring-amber-500'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName()
                if (e.key === 'Escape') setEditingName(false)
              }}
              className="flex-1 text-sm font-bold bg-transparent border-b-2 border-violet-400 text-slate-900 dark:text-white outline-none pb-0.5"
            />
            <button onClick={handleSaveName} className="text-emerald-500 hover:text-emerald-600">
              <Check size={15} />
            </button>
            <button onClick={() => setEditingName(false)} className="text-slate-400 hover:text-slate-600">
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {list.starred && <Star size={13} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
            <h3 className="font-bold text-slate-900 dark:text-white truncate">{list.name}</h3>
            <button
              onClick={() => setEditingName(true)}
              className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 flex-shrink-0"
            >
              <Pencil size={12} />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleStar}
            title={list.starred ? 'Remover do dashboard' : 'Mostrar no dashboard'}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              list.starred
                ? 'text-amber-400 hover:text-amber-500'
                : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
            )}
          >
            <Star size={15} className={list.starred ? 'fill-amber-400' : ''} />
          </button>
          <button
            onClick={handleArchive}
            title="Arquivar lista"
            className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-all"
          >
            <Archive size={15} />
          </button>
          <button
            onClick={handleDelete}
            title="Deletar lista"
            className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 transition-all"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-3">
        <AnimatePresence initial={false}>
          {[...pending, ...done].map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 group"
            >
              <button
                onClick={() => handleToggleItem(item.id)}
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  item.done
                    ? 'bg-violet-500 border-violet-500'
                    : 'border-slate-300 dark:border-slate-600 hover:border-violet-400'
                )}
              >
                {item.done && (
                  <svg viewBox="0 0 10 10" className="w-3 h-3 text-white" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span
                className={cn(
                  'text-sm flex-1 transition-all',
                  item.done
                    ? 'line-through text-slate-400 dark:text-slate-600'
                    : 'text-slate-700 dark:text-slate-300'
                )}
              >
                {item.text}
              </span>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
              >
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add input */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            if (draft.trim()) { handleAddItem(draft.trim()); setDraft('') }
            else inputRef.current?.focus()
          }}
          className="w-5 h-5 rounded-md border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0 hover:border-violet-400 transition-colors"
        >
          <Plus size={10} className="text-slate-400" />
        </button>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite aqui..."
          className="flex-1 text-sm bg-transparent text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 outline-none"
        />
      </div>

      {/* Summary */}
      {list.items.length > 0 && (
        <p className="text-xs text-slate-400 mt-2">
          {done.length}/{list.items.length} concluídas
        </p>
      )}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────

export function TodosPage() {
  const { user } = useAuth()
  const { lists } = useTodoLists()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreate = async () => {
    if (!user || !newName.trim()) return
    await createTodoList(user.uid, newName.trim())
    toast.success('Lista criada!')
    setNewName('')
    setCreating(false)
  }

  const allListIds = lists.map((l) => l.id)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">To-dos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {lists.length} lista{lists.length !== 1 ? 's' : ''} ativa{lists.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Nova lista
        </button>
      </motion.div>

      {/* New list form */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card p-4 mb-4 flex items-center gap-3"
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') { setCreating(false); setNewName('') }
              }}
              placeholder="Nome da lista..."
              className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none font-semibold"
            />
            <button onClick={handleCreate} disabled={!newName.trim()} className="btn-primary text-sm disabled:opacity-40">
              Criar
            </button>
            <button onClick={() => { setCreating(false); setNewName('') }} className="btn-ghost text-sm">
              Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {lists.length === 0 && !creating ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhuma lista ainda</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Crie sua primeira lista de tarefas</p>
          <button onClick={() => setCreating(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} />
            Criar lista
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => (
            <TodoListCard
              key={list.id}
              list={list}
              allListIds={allListIds}
              onStar={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  )
}
