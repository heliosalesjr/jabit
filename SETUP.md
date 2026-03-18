# myTracker Setup

## 1. Firebase Setup

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um novo projeto (ou use um existente)
3. Ative **Authentication** → Google provider
4. Ative **Firestore Database** (modo produção)
5. Vá em **Project Settings** → Web app → copie as credenciais

## 2. Configurar variáveis de ambiente

Edite `.env.local` com suas credenciais:

```
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

## 3. Firestore Security Rules

Copie o conteúdo de `firestore.rules` para o console do Firebase (Firestore → Rules).

## 4. Rodar o app

```bash
npm run dev
```

Acesse http://localhost:5173

## Estrutura do projeto

```
src/
├── pages/         # DashboardPage, HabitsPage, JournalPage, AchievementsPage, LoginPage
├── components/    # HabitCard, HabitForm, AchievementCard, layout...
├── hooks/         # useHabits, useHabitLogs, useJournal, useAchievements
├── context/       # AuthContext, ThemeContext
├── firebase/      # config, auth, firestore helpers
├── lib/           # achievements definitions, streak logic, cn utility
├── data/          # journalPrompts (70+ prompts em PT-BR)
└── types/         # TypeScript interfaces
```
