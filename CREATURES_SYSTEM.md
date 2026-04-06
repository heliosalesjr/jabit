# 🥚 Sistema de Criaturas — Jabit

Gamificação com ovos misteriosos que chocam e evoluem à medida que o usuário completa tarefas, forma streaks e colabora com amigos.

---

## Visão Geral

O usuário **ganha ovos** como recompensa. Para chocar e evoluir as criaturas, precisa acumular **pontos de incubação** completando hábitos, to-dos e ações sociais. Cada ovo revela uma criatura surpresa ao nascer, e ela pode evoluir em até 3 estágios.

```
OVO (bloqueado)
  ↓  [preenche barra de incubação]
FILHOTE (estágio 1)
  ↓  [preenche barra de evolução 1→2]
JOVEM (estágio 2)
  ↓  [preenche barra de evolução 2→3]
ADULTO (estágio 3) ✨ forma final
```

---

## Criaturas

Cada criatura pertence a uma **raridade** que determina a chance de aparecer no ovo.

### MVP (fase 1)

| # | Nome | Tema | Raridade | Emoji referência |
|---|------|------|----------|-----------------|
| 1 | Capivara | Animal BR | Comum | 🦫 |
| 2 | Tucano | Animal BR | Comum | 🦜 |
| 3 | Onça-pintada | Animal BR | Incomum | 🐆 |
| 4 | Dragão das Serras | Fantasia BR | Raro | 🐉 |

### Fase 2

| # | Nome | Tema | Raridade | Emoji referência |
|---|------|------|----------|-----------------|
| 5 | Tamanduá | Animal BR | Comum | 🐾 |
| 6 | Boto-cor-de-rosa | Animal BR | Incomum | 🐬 |
| 7 | Arara-azul | Animal BR | Incomum | 🦚 |
| 8 | Curupira | Folclore BR | Raro | 🌿 |
| 9 | Saci | Folclore BR | Raro | 🌀 |
| 10 | Iara | Folclore BR | Épico | 🧜 |
| 11 | Boitatá | Folclore BR | Épico | 🔥 |
| 12 | Mapinguari | Lenda BR | Lendário | 💀 |
| 13 | Uirapuru | Mito BR | Lendário | ✨ |

### Tabela de raridade e drop rate

| Raridade | Cor | Chance de aparecer |
|----------|-----|-------------------|
| Comum | Cinza / Verde | 50% |
| Incomum | Azul | 28% |
| Raro | Roxo | 14% |
| Épico | Laranja | 6% |
| Lendário | Dourado | 2% |

---

## Tipos de Ovo

O tipo de ovo determina o **pool de criaturas** possíveis — não a raridade diretamente.

| Ovo | Visual | Pool de criaturas | Como obter |
|-----|--------|-------------------|-----------|
| 🥚 Ovo da Floresta | Marrom/verde | Comuns + Incomuns animais | 7 dias de streak de hábitos |
| 🌊 Ovo do Rio | Azul/turquesa | Comuns + Incomuns + Boto | 7 dias de streak com parceiro |
| 🌙 Ovo Noturno | Roxo/preto | Raros + Épicos | 30 dias de streak |
| ⭐ Ovo Estelar | Dourado/branco | Todos (épico e lendário com chance aumentada) | Conquista especial ou evento |
| 🤝 Ovo de Parceria | Rosa/vermelho | Pool exclusivo de criaturas sociais | 30 dias de parceria de hábito |

---

## Pontos de Incubação

Ações que geram **XP de incubação** (aplicadas ao ovo ativo):

### Ações solo
| Ação | XP |
|------|----|
| Completar um hábito do dia | +10 |
| Completar todos os hábitos do dia | +25 (bônus) |
| Adicionar entrada no diário | +15 |
| Completar um to-do | +5 |
| Completar uma lista inteira de to-dos | +20 (bônus) |
| Manter streak (a cada 7 dias) | +50 |

### Ações sociais (dobrado se feito no mesmo dia que o parceiro)
| Ação | XP |
|------|----|
| Hábito em parceria completado | +20 |
| Parceiro também completou (sync check-in) | +20 extra |
| Enviar/aceitar pedido de amizade | +10 |

---

## Requisitos por estágio

### Incubação (Ovo → Filhote)
| Raridade | XP necessário |
|----------|--------------|
| Comum | 200 XP |
| Incomum | 350 XP |
| Raro | 600 XP |
| Épico | 1.000 XP |
| Lendário | 2.000 XP |

### Evolução 1→2 (Filhote → Jovem)
| Raridade | XP necessário |
|----------|--------------|
| Comum | 300 XP |
| Incomum | 500 XP |
| Raro | 900 XP |
| Épico | 1.500 XP |
| Lendário | 3.000 XP |

### Evolução 2→3 (Jovem → Adulto)
| Raridade | XP necessário |
|----------|--------------|
| Comum | 400 XP |
| Incomum | 700 XP |
| Raro | 1.200 XP |
| Épico | 2.000 XP |
| Lendário | 4.500 XP |

---

## Mecânica de Múltiplos Ovos

- O usuário pode ter **vários ovos** na coleção, mas apenas **1 ovo ativo** por vez (recebe XP)
- Ao chocar, o ovo ativo é substituído pelo próximo da fila
- O usuário escolhe manualmente qual ovo ativar
- Criaturas já nascidas ficam na **Coleção** (podem ter múltiplas do mesmo tipo em estágios diferentes)

---

## Coleta / Coleção

Página `/creatures` (ou aba dentro de `/achievements`):

- **Fila de Ovos** — ovos não ativos aguardando
- **Ovo Ativo** — barra de progresso de incubação, animação de tremor quando perto de chocar
- **Minhas Criaturas** — galeria de criaturas nascidas ordenadas por raridade
- **Pokédex** — todas as criaturas possíveis (ocultas até descobertas, exceto silhueta + "???" para as raras)

---

## Eventos de Destaque (UX)

| Momento | Animação / Feedback |
|---------|---------------------|
| Ovo ativo ganha XP | Barra de progresso pulsa suavemente |
| Ovo perto de chocar (~90%) | Ovo treme / racha visivelmente |
| Chocamento | Tela de abertura com animação de casca quebrando + reveal da criatura |
| Evolução | Animação de brilho + antes/depois do sprite |
| Criatura rara ou lendária | Confetti + toast especial |
| Sync check-in com parceiro | Ovo do parceiro aparece junto na animação |

---

## Estrutura de Dados (Firestore)

```
users/{uid}
├── eggs/{eggId}
│   ├── type: "forest" | "river" | "night" | "stellar" | "partnership"
│   ├── status: "locked" | "incubating" | "hatching" | "hatched"
│   ├── currentXP: number
│   ├── creatureId: string | null        — null até chocar
│   ├── rarity: "common" | ... | "legendary"
│   ├── obtainedAt: Timestamp
│   └── hatchedAt: Timestamp | null
│
└── creatures/{creatureId}
    ├── speciesId: string                — ex: "capivara", "dragonSerras"
    ├── eggId: string                    — ovo de origem
    ├── rarity: string
    ├── stage: 1 | 2 | 3
    ├── currentXP: number
    ├── xpForNextStage: number
    ├── bornAt: Timestamp
    └── lastEvolvedAt: Timestamp | null
```

---

## Assets Necessários

### Ovos (5 tipos × estado visual)
Para cada tipo de ovo (`forest`, `river`, `night`, `stellar`, `partnership`):
- [ ] `egg_{type}_idle` — estado normal
- [ ] `egg_{type}_cracking` — >90% incubado
- [ ] `egg_{type}_hatching` — animação de abertura

> **Total ovos:** 5 tipos × 3 estados = **15 sprites/animações**

---

### Criaturas — MVP (4 espécies × 3 estágios)
Para cada criatura, por estágio (filhote → jovem → adulto):
- [ ] `capivara_stage{1,2,3}_idle`
- [ ] `tucano_stage{1,2,3}_idle`
- [ ] `onca_stage{1,2,3}_idle`
- [ ] `dragao_stage{1,2,3}_idle`

> **Total sprites MVP:** 4 espécies × 3 estágios = **12 sprites**

> Fase 2: adicionar as 9 criaturas restantes + animações de evolução (+26 animações)

---

### UI / Ícones
- [ ] Ícone de XP de incubação (bolinha brilhante, diferente do XP de pontos)
- [ ] Slot de ovo ativo (moldura animada)
- [ ] Barra de progresso de incubação (estilo diferente das barras normais)
- [ ] Barra de progresso de evolução
- [ ] Badge de raridade (5 variantes: comum, incomum, raro, épico, lendário)
- [ ] Silhueta "???" para criaturas não descobertas na Pokédex
- [ ] Ícone de "ovo em fila"

> **Total UI:** ~10 peças

---

### Sons (opcional, fase 2)
- [ ] Som de XP ganhado (ding suave)
- [ ] Som de ovo tremendo
- [ ] Som de chocamento
- [ ] Som de evolução
- [ ] Fanfarra para criatura lendária

---

## Resumo de Assets para MVP

| Categoria | Quantidade |
|-----------|-----------|
| Sprites de ovos (idle + cracking) | 10 |
| Sprites de criaturas — fase 1 (3 estágios × 4) | 12 |
| Peças de UI | ~10 |
| **Total MVP** | **~32 peças** |

Fase 2 completa (13 criaturas + animações + sons): ~90+ assets no total.

---

## Próximos Passos

1. **Validar lista de criaturas** — adicionar/remover espécies, ajustar raridades
2. **Definir estilo visual** — pixel art? ilustração flat? 2D animado?
3. **Escolher ferramenta de assets** — contratar artista, usar IA (Midjourney/DALL-E), ou sprites livres
4. **Priorizar para MVP** — sugestão: 3 criaturas comuns + 1 rara para lançar o sistema
5. **Implementação** — hooks, Firestore, componentes, página `/creatures`
