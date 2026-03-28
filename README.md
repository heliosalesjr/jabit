# Jabit ✨

App de hábitos, diário e metas pessoais com funcionalidades sociais. Interface em português, design vibrante com suporte a tema claro/escuro.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Estilo:** Tailwind CSS v3 (dark mode via `class`)
- **Backend:** Firebase (Auth + Firestore)
- **Animações:** Framer Motion
- **Roteamento:** React Router v6
- **UI:** lucide-react, react-hot-toast, date-fns

## Funcionalidades

- **Hábitos** — criar, rastrear e arquivar hábitos com frequência customizável (diário, dias úteis, fins de semana, dias específicos)
- **Diário** — entrada diária com prompt aleatório em PT-BR e registro de humor
- **Notas rápidas** — blocos de nota coloridos e listas de tarefas na dashboard
- **Conquistas** — sistema de gamificação com 17+ conquistas e pontos
- **Amigos** — adicionar por email, pedidos de amizade, convite via mensagem para usuários sem conta
- **Hábitos com amigos** — parcerias de hábito: compartilhe um hábito com um amigo, acompanhe o progresso juntos e ganhe bônus de +10 pts quando ambos fazem no mesmo dia
- **Notificações** — badges no nav para pedidos de amizade e convites de hábito pendentes
- **Perfil** — estatísticas pessoais, tema, pontos e histórico de conquistas

## Estrutura Firestore

```
users/{uid}                        — UserProfile (pontos, streak, tema)
users/{uid}/habits/{id}            — definição do hábito
users/{uid}/habitLogs/{id}         — check-ins diários
users/{uid}/journalEntries/{id}    — entradas do diário (ID = data ISO)
users/{uid}/achievements/{id}      — conquistas desbloqueadas
users/{uid}/todoLists/{id}         — listas de tarefas
users/{uid}/quickNotes/{id}        — notas rápidas

friendRequests/{id}                — pedidos de amizade pendentes
friendships/{id}                   — conexões confirmadas (campo users: [uid, uid])
pendingInvites/{email}             — convites para emails sem conta
habitPartnerships/{id}             — parcerias de hábito entre dois usuários
```

## Arquivos principais

| Arquivo | Descrição |
|---|---|
| `src/types/index.ts` | Todas as interfaces TypeScript |
| `src/firebase/firestore.ts` | Helpers de leitura/escrita no Firestore |
| `src/firebase/auth.ts` | Google Sign-In e sign-out |
| `src/lib/achievements.ts` | Definições estáticas das 17 conquistas |
| `src/lib/streaks.ts` | Cálculo de streaks e agendamento de hábitos |
| `src/data/journalPrompts.ts` | 70+ prompts diários em PT-BR |
| `src/context/AuthContext.tsx` | Contexto de autenticação + auto-conexão de convites |
| `src/context/NotificationsContext.tsx` | Contagem global de badges do nav |
| `firestore.rules` | Regras de segurança do Firestore |

## Páginas

| Rota | Página |
|---|---|
| `/` | Dashboard — hábitos de hoje, "Com amigos", notas, diário, conquistas recentes |
| `/habits` | Gerenciar hábitos, parcerias e convites pendentes |
| `/journal` | Diário diário com prompt e humor |
| `/todos` | Listas de tarefas e notas rápidas |
| `/friends` | Amigos, pedidos de amizade e convites |
| `/achievements` | Todas as conquistas (solo + sociais) |
| `/profile` | Perfil, estatísticas, tema e logout |

## Configuração

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz com as credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Firebase Console

1. Habilitar **Google Sign-In** em Authentication > Sign-in methods
2. Copiar as regras de `firestore.rules` para Firestore > Rules

### Rodando localmente

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

## Regras Firestore

As regras de segurança estão em `firestore.rules`. As coleções top-level (`friendRequests`, `friendships`, `pendingInvites`, `habitPartnerships`) precisam ser publicadas manualmente no Firebase Console.
