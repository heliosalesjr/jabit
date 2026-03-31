import { useState, useRef, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ArrowRight, GripVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '../../lib/cn'
import type { TodoList, TodoItem } from '../../types'

interface TodoListBlockProps {
  list: TodoList
  onToggleItem: (itemId: string) => void
  onAddItem: (text: string) => void
  onReorderItems: (items: TodoItem[]) => void
}

function SortableTodoItemRow({
  item,
  onToggle,
}: {
  item: TodoItem
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-center gap-2 group', isDragging && 'opacity-50')}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-slate-200 dark:text-slate-700 hover:text-slate-400 dark:hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
      >
        <GripVertical size={13} />
      </button>
      <button
        onClick={onToggle}
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
      <span className={cn('text-sm transition-all', item.done ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300')}>
        {item.text}
      </span>
    </div>
  )
}

export function TodoListBlock({ list, onToggleItem, onAddItem, onReorderItems }: TodoListBlockProps) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const pending = list.items.filter((i) => !i.done)
  const done = list.items.filter((i) => i.done)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = pending.findIndex((i) => i.id === active.id)
    const newIndex = pending.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorderItems([...arrayMove(pending, oldIndex, newIndex), ...done])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && draft.trim()) {
      onAddItem(draft.trim())
      setDraft('')
    }
  }

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <span className="text-base">✅</span>
          {list.name}
          {pending.length > 0 && (
            <span className="text-xs font-normal text-slate-400">
              {pending.length} pendente{pending.length !== 1 ? 's' : ''}
            </span>
          )}
        </h3>
        <Link to="/todos" className="text-slate-400 hover:text-violet-500 transition-colors" title="Ver todas as listas">
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pending.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {pending.map((item) => (
              <SortableTodoItemRow key={item.id} item={item} onToggle={() => onToggleItem(item.id)} />
            ))}
          </SortableContext>
        </DndContext>
        <AnimatePresence initial={false}>
          {done.map((item) => (
            <motion.div key={item.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 pl-4"
            >
              <button
                onClick={() => onToggleItem(item.id)}
                className="w-5 h-5 rounded-md border-2 bg-violet-500 border-violet-500 flex items-center justify-center flex-shrink-0"
              >
                <svg viewBox="0 0 10 10" className="w-3 h-3 text-white" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-sm line-through text-slate-400 dark:text-slate-600">{item.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {list.items.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-600 italic py-1">Nenhuma tarefa ainda</p>
        )}
      </div>

      {/* Add item input */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { if (draft.trim()) { onAddItem(draft.trim()); setDraft('') } else inputRef.current?.focus() }}
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
    </div>
  )
}
