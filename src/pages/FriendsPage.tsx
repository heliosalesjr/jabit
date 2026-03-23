import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Check, X, Clock, Users, Mail, UserMinus, Send, Copy, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useFriends } from '../hooks/useFriends'
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from '../firebase/firestore'
import type { FriendRequest, UserProfile, Friendship } from '../types'

// ─── Sub-components ────────────────────────────────────────────────

function Avatar({ src, name, size = 'md' }: { src: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-14 h-14 text-xl' }
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full ring-2 ring-violet-200 dark:ring-violet-900 object-cover flex-shrink-0`}
      />
    )
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function IncomingCard({ request, onAccept, onReject }: {
  request: FriendRequest
  onAccept: () => void
  onReject: () => void
}) {
  const [busy, setBusy] = useState(false)

  const handle = async (action: () => Promise<void>) => {
    setBusy(true)
    try { await action() } finally { setBusy(false) }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="card p-4 flex items-center gap-3"
    >
      <Avatar src={request.fromPhoto} name={request.fromName} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{request.fromName}</p>
        <p className="text-xs text-slate-400 truncate">{request.toEmail}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => handle(onAccept)}
          disabled={busy}
          className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors disabled:opacity-50"
        >
          <Check size={16} />
        </button>
        <button
          onClick={() => handle(onReject)}
          disabled={busy}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  )
}

function OutgoingCard({ request, onCancel }: {
  request: FriendRequest
  onCancel: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="card p-4 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
        <Mail size={18} className="text-violet-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{request.toEmail}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock size={11} className="text-amber-400" />
          <p className="text-xs text-amber-500">Aguardando resposta</p>
        </div>
      </div>
      <button
        onClick={onCancel}
        className="text-xs text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        Cancelar
      </button>
    </motion.div>
  )
}

function FriendCard({ profile, friendship, onRemove }: {
  profile: UserProfile
  friendship: Friendship
  onRemove: () => void
}) {
  const [confirmRemove, setConfirmRemove] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="card p-4 flex items-center gap-3"
    >
      <Avatar src={profile.photoURL} name={profile.displayName} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{profile.displayName}</p>
        <p className="text-xs text-slate-400 truncate">{profile.email}</p>
      </div>
      {confirmRemove ? (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onRemove}
            className="text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Confirmar
          </button>
          <button
            onClick={() => setConfirmRemove(false)}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmRemove(true)}
          className="w-9 h-9 rounded-xl text-slate-300 dark:text-slate-600 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <UserMinus size={16} />
        </button>
      )}
    </motion.div>
  )
}

// ─── Invite Modal ─────────────────────────────────────────────────

const APP_URL = 'https://jabit.vercel.app'

function InviteModal({
  toEmail,
  fromName,
  onClose,
}: {
  toEmail: string
  fromName: string
  onClose: () => void
}) {
  const message = `Oi! Eu uso o Jabit para acompanhar meus hábitos e queria te convidar para usarmos juntos. Entre com sua conta Google em ${APP_URL} e a gente já fica conectado automaticamente! 🎯`
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Pessoa ainda não tem conta</p>
              <p className="text-xs text-slate-400 truncate">{toEmail}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Quando ela entrar no Jabit com essa conta Google, vocês serão <span className="font-semibold text-violet-500">conectados automaticamente</span>. Enquanto isso, mande o convite abaixo:
          </p>

          {/* Message preview */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                copied
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50'
              }`}
            >
              <Copy size={14} />
              {copied ? 'Copiado!' : 'Copiar mensagem'}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all"
            >
              <ExternalLink size={14} />
              WhatsApp
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────

export function FriendsPage() {
  const { user } = useAuth()
  const { incoming, outgoing, friendships, friendProfiles, loading } = useFriends()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!user || !email.trim()) return
    setSending(true)
    try {
      const result = await sendFriendRequest(
        {
          uid: user.uid,
          displayName: user.displayName ?? 'Usuário',
          photoURL: user.photoURL ?? '',
          email: user.email ?? '',
        },
        email.trim()
      )

      if (result === 'sent') {
        toast.success('Pedido de amizade enviado!')
        setEmail('')
      } else if (result === 'invited') {
        setInvitedEmail(email.trim())
        setEmail('')
      } else if (result === 'already_sent') {
        toast('Você já enviou um pedido para esse email.', { icon: '⏳' })
      } else if (result === 'self') {
        toast('Esse é o seu próprio email!', { icon: '😄' })
      }
    } catch (err) {
      console.error('Friend request error:', err)
      toast.error('Erro ao enviar pedido')
    } finally {
      setSending(false)
    }
  }

  const handleAccept = async (req: FriendRequest) => {
    if (!user) return
    await acceptFriendRequest(req.id, req.fromUid, user.uid)
    toast.success(`Agora vocês são amigos!`)
  }

  const handleReject = async (req: FriendRequest) => {
    await rejectFriendRequest(req.id)
    toast('Pedido recusado.')
  }

  const handleCancel = async (req: FriendRequest) => {
    await cancelFriendRequest(req.id)
    toast('Pedido cancelado.')
  }

  const handleRemove = async (friendship: Friendship) => {
    await removeFriend(friendship.id)
    toast('Amigo removido.')
  }

  const getFriendship = (uid: string) =>
    friendships.find((f) => f.users.includes(uid))

  return (
    <div className="p-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Amigos</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Conecte-se e mantenha hábitos juntos
        </p>
      </motion.div>

      {/* Add friend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-4 mb-6"
      >
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <UserPlus size={15} className="text-violet-500" />
          Adicionar amigo
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="email@gmail.com"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!email.trim() || sending}
            className="btn-primary text-sm px-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Send size={14} />
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Se a pessoa já tiver conta, o pedido chega direto. Se não tiver, vamos te dar uma mensagem para convidar ela.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Incoming requests */}
          <AnimatePresence>
            {incoming.length > 0 && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 px-1">
                  Pedidos recebidos ({incoming.length})
                </p>
                <div className="space-y-2">
                  <AnimatePresence>
                    {incoming.map((req) => (
                      <IncomingCard
                        key={req.id}
                        request={req}
                        onAccept={() => handleAccept(req)}
                        onReject={() => handleReject(req)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Outgoing requests */}
          <AnimatePresence>
            {outgoing.length > 0 && (
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 px-1">
                  Pedidos enviados
                </p>
                <div className="space-y-2">
                  <AnimatePresence>
                    {outgoing.map((req) => (
                      <OutgoingCard
                        key={req.id}
                        request={req}
                        onCancel={() => handleCancel(req)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Friends list */}
          <section>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 px-1">
              Meus amigos ({friendProfiles.length})
            </p>
            {friendProfiles.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="w-14 h-14 rounded-3xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-violet-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Nenhum amigo ainda</p>
                <p className="text-sm text-slate-400 mt-1">
                  Adicione amigos pelo email para manter hábitos juntos
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {friendProfiles.map((profile) => {
                    const friendship = getFriendship(profile.uid)
                    if (!friendship) return null
                    return (
                      <FriendCard
                        key={profile.uid}
                        profile={profile}
                        friendship={friendship}
                        onRemove={() => handleRemove(friendship)}
                      />
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Invite modal */}
      <AnimatePresence>
        {invitedEmail && (
          <InviteModal
            toEmail={invitedEmail}
            fromName={user?.displayName ?? 'Você'}
            onClose={() => setInvitedEmail(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
