# 🎮 WuxiaMUD - Game Design Document
## Sistema de Quests, Lore e NPCs
### Target: 300-350 horas de conteúdo

**Versão:** 1.0  
**Data:** Janeiro 2026  
**Autor:** Design Team

---

## 📊 Sumário Executivo

### Objectivo
Criar um sistema de quests robusto que ofereça **300-350 horas** de gameplay, mantendo o tema Wuxia/Xianxia autêntico com foco na jornada de cultivo, política de seitas e ascensão ao reino imortal.

### Estimativa de Tempo por Sistema

| Sistema | Horas Estimadas | Percentagem |
|---------|----------------|-------------|
| Main Story | 40-50h | 15% |
| Side Quests | 60-80h | 20% |
| Daily Quests | 80-100h (repetível) | 25% |
| Bounty System | 40-50h | 15% |
| Cultivation Trials | 30-40h | 12% |
| Exploration/Discovery | 30-40h | 10% |
| NPC Reputation | 20-30h | 8% |
| **TOTAL** | **300-390h** | 100% |

---

## 📖 PARTE 1: LORE E MUNDO

### 1.1 História do Mundo

#### O Continente Tianyun (天云大陆)
Há mil anos, o **Imperador Celestial Xuanwu** ascendeu ao reino imortal, deixando para trás um mundo fragmentado. Seu último acto foi dividir sua essência em **Cinco Pilares Elementais** que sustentam o equilíbrio do mundo:

- 🔥 **Pilar do Fogo Eterno** - Montanhas Vulcânicas do Sul
- ❄️ **Pilar do Gelo Primordial** - Terras Congeladas do Norte  
- 🌿 **Pilar da Floresta Ancestral** - Grande Floresta do Este
- ⚡ **Pilar da Tempestade** - Planícies Trovejantes do Oeste
- 🌑 **Pilar do Vazio** - Abismo Central (selado)

#### A Era das Seitas
Após a ascensão do Imperador, surgiram **Sete Grandes Seitas** que competem pelo domínio:

1. **Seita da Espada Celestial** (玄剑宗) - A nossa seita inicial
2. **Pavilhão do Lótus Jade** - Especialistas em medicina e venenos
3. **Monte Trovão Divino** - Mestres de técnicas de raio
4. **Vale das Sombras Eternas** - Cultivadores das artes obscuras
5. **Templo do Dragão Dourado** - Monges marciais
6. **Clã das Mil Flores** - Mestres de ilusões
7. **Aliança do Punho de Ferro** - Cultivadores corporais

#### Conflito Central
O **Pilar do Vazio** está a enfraquecer. Criaturas demoníacas começam a escapar. As seitas culpam-se mutuamente enquanto uma ameaça antiga desperta nas profundezas.

---

### 1.2 Realms e Zonas

#### Qi Condensation (Níveis 1-9)
**Tema:** Aprendiz da seita, provar o teu valor

| Zona | Nível | Descrição |
|------|-------|-----------|
| Pátio dos Discípulos | 1-3 | Área segura, treino básico |
| Floresta Externa | 2-5 | Primeiros monstros selvagens |
| Cavernas de Cristal | 4-6 | Minas de materiais básicos |
| Colinas Nebulosas | 5-7 | Bestas espirituais fracas |
| Ruínas Antigas | 6-9 | Restos de civilização antiga |
| Pântano Venenoso | 7-9 | Preparação para Foundation |

#### Foundation Establishment (Níveis 10-19)
**Tema:** Discípulo interno, missões para a seita

| Zona | Nível | Descrição |
|------|-------|-----------|
| Vila da Fronteira | 10-12 | Problemas com bandidos |
| Floresta Proibida | 11-14 | Território de bestas-demónio |
| Torre do Vento | 13-15 | Dungeon de 5 andares |
| Desfiladeiro Sangrento | 14-16 | Zona de guerra entre seitas |
| Santuário Abandonado | 15-17 | Segredos do passado |
| Montanha da Neblina | 16-19 | Portal para Golden Core |

#### Golden Core (Níveis 20-29)
**Tema:** Elite da seita, política e poder

| Zona | Nível | Descrição |
|------|-------|-----------|
| Capital Imperial | 20-22 | Intriga política |
| Palácio Subterrâneo | 21-24 | Tumba de cultivador antigo |
| Ilhas Flutuantes | 23-25 | Ruínas celestiais |
| Abismo Inferior | 24-27 | Fronteira do Vazio |
| Domínio Demoníaco | 26-28 | Território inimigo |
| Portão Celestial | 28-29 | Preparação para Nascent Soul |

---

## 🎯 PARTE 2: SISTEMA DE QUESTS

### 2.1 Tipos de Quest

#### A) Main Story Quests (主线任务)
**Quantidade:** 50 quests principais  
**Tempo Total:** 40-50 horas

Divididas em **5 Arcos**:

**Arco 1: O Despertar (Níveis 1-5)**
- 10 quests introdutórias
- Aprender as bases do cultivo
- Descobrir talento especial do jogador
- Primeiro encontro com antagonista

**Arco 2: Sombras da Traição (Níveis 5-15)** ✅ IMPLEMENTADO
- 10 quests de progressão
- Competição interna da seita
- Primeira missão fora da seita
- Revelação de conspiração

**Quests Implementadas - Arco 2:**
| ID | Nome | Nível | Descrição |
|----|------|-------|-----------|
| main_006 | A Seita em Tumulto | 7 | Tensão política entre Anciãos |
| main_007 | O Caçador de Sombras | 10 | Encontro com Elder Moyin do Vale das Sombras |
| main_008 | Máscaras de Engano | 12 | Múltiplos suspeitos, escolhas morais |
| main_009 | Descida às Trevas | 15 | Corrupção do Ancião Huoyan revelada |
| main_010 | O Vazio Desperta | 18 | Confronto final do Arco 2, selamento de fenda |

**Narrativa Detalhada - Arco 2:**
1. **A Seita em Tumulto**: Elder Xuanming convoca-te para investigar distúrbios causados por cultivadores corruptos. Tensão cresce entre os Anciãos.
2. **O Caçador de Sombras**: Elder Moyin do Vale das Sombras surge como aliado improvável, revelando que a corrupção do Vazio afecta todas as seitas.
3. **Máscaras de Engano**: Descobres que Mei Lin foi culpada injustamente. Múltiplos suspeitos surgem - Elder Huoyan, Discípulo Chen, ou outro?
4. **Descida às Trevas**: A verdade revelada - Elder Huoyan foi corrompido pela energia do Vazio. Deves confrontá-lo antes que complete um ritual proibido.
5. **O Vazio Desperta**: Batalha épica nas profundezas. Selas a fenda temporariamente, mas a ameaça permanece adormecida.

**Arco 3: Guerra das Sombras (Níveis 18-22)**
- 12 quests de desenvolvimento
- Investigar corrupção em OUTRAS seitas
- Alianças com o Vale das Sombras (improvável)
- Confrontar ameaças maiores do Vazio

**Arco 4: A Guerra das Seitas (Níveis 18-25)**
- 10 quests épicas
- Conflito aberto entre seitas
- Escolhas morais difíceis
- Despertar do poder ancestral

**Arco 5: Ascensão (Níveis 25-29)**
- 8 quests finais
- Confrontar a ameaça do Vazio
- Decisão sobre o futuro do mundo
- Múltiplos finais

---

#### B) Daily Quests (日常任务)
**Quantidade:** 20 tipos diferentes  
**Reset:** A cada 24 horas reais  
**Slots:** 5 quests por dia

| Categoria | Quests | Descrição |
|-----------|--------|-----------|
| Caça | 4 | Matar X mobs de tipo Y |
| Colecta | 4 | Obter X materiais |
| Treino | 4 | Usar X skills, meditar Y minutos |
| Patrulha | 4 | Visitar X zonas |
| Ajuda | 4 | Entregar items a NPCs |

**Rewards por Quest:**
- 💰 50-200 Spirit Stones (baseado no nível)
- ⭐ 10-50 Contribution Points
- 📦 Chance de materiais raros

**Sistema de Streak:**
- 7 dias seguidos: +50% rewards
- 14 dias seguidos: +100% rewards + item raro
- 30 dias seguidos: +150% rewards + título especial

---

#### C) Bounty Quests (悬赏任务)
**Quantidade:** 100 bounties únicos  
**Dificuldade:** 5 níveis (D, C, B, A, S)

| Rank | Nível Req. | Tempo Limite | Recompensa Base |
|------|------------|--------------|-----------------|
| D | 1-5 | 2h | 100 SS + Comum item |
| C | 5-10 | 4h | 300 SS + Uncommon item |
| B | 10-18 | 8h | 800 SS + Rare item |
| A | 18-25 | 24h | 2000 SS + Epic item |
| S | 25+ | 72h | 5000 SS + Legendary chance |

**Tipos de Bounty:**
1. **Caça ao Criminoso** - Matar mob específico de elite
2. **Resgate** - Salvar NPC de dungeon
3. **Recuperação** - Obter item de boss
4. **Investigação** - Descobrir pistas em múltiplas zonas
5. **Assassinato** - Eliminar alvo sem ser detectado

---

#### D) Side Quests (支线任务)
**Quantidade:** 150 quests secundárias  
**Tempo Total:** 60-80 horas

Organizadas por **Zona** e **Tema**:

**Temas Disponíveis:**
- 👨‍👩‍👦 Família & Romance (15 quests)
- ⚔️ Rivalidade & Duelos (20 quests)
- 🔮 Mistérios & Lore (25 quests)
- 💰 Comércio & Recursos (20 quests)
- 🏰 Política de Seitas (25 quests)
- 👹 Ameaças Demoníacas (25 quests)
- 📜 Legados Antigos (20 quests)

---

#### Side Quests Implemented ✅

**Mei Lin Arc (Rivalry → Friendship)**
| ID | Name | Level | Description |
|----|------|-------|-----------|
| side_rival_001 | A Challenge from Mei Lin | 5 | Prove your worth by defeating enemies |
| side_rival_002 | The Secret Training Ground | 8 | Explore the legendary training grounds |
| side_rival_003 | The Price of Rivalry | 12 | Rescue Mei Lin from the Beast Den |

**Mei Lin Arc Narrative:**
- Mei Lin starts as a competitive rival jealous of your progress
- Gradually develops respect through collaboration
- Final quest involves saving her from her own stubbornness
- Unlocks title: "Loyal Companion"

**Investigation Quests (Scribe Zhang)**
| ID | Name | Level | Description |
|----|------|-------|-----------|
| side_library_001 | The Forbidden Section | 10 | Investigate scrolls about the Void Emperor |

**Valley of Shadows Quests (Elder Moyin)**
| ID | Name | Level | Description |
|----|------|-------|-----------|
| side_shadow_001 | Lessons from the Dark | 18 | Learn shadow techniques to understand the enemy |

**Swamp Quests (Hermit Zhang)**
| ID | Name | Level | Description |
|----|------|-------|-----------|
| side_hermit_001 | The Mad Sage's Wisdom | 6 | Cryptic prophecies about the Void |

---

#### E) Cultivation Trials (修炼试炼)
**Quantidade:** 12 trials (1 por classe)  
**Tempo por Trial:** 2-3 horas

Cada classe tem um **Trial único** que desbloqueia:
- Skill Ultimate (Tier 4)
- Título de Classe
- Aparência especial

**Exemplo - Blazing Sword Immortal Trial:**
1. Meditar no Vulcão Sagrado (10 min)
2. Derrotar 100 elementais de fogo
3. Sobreviver ao Inferno Trial (5 ondas)
4. Derrotar o Phoenix Guardian (boss)
5. Absorver a Essência do Phoenix

---

### 2.2 Estrutura de Quest

```typescript
interface Quest {
  id: string;
  name: string;
  type: 'main' | 'daily' | 'bounty' | 'side' | 'trial';
  chapter?: number; // Para main quests
  
  // Requisitos
  levelRequired: number;
  classRequired?: number; // Para trials
  prerequisiteQuests?: string[];
  
  // Descrição
  giver: string; // NPC que dá a quest
  description: string;
  lore: string; // Texto de história
  
  // Objectivos
  objectives: QuestObjective[];
  
  // Rewards
  rewards: {
    exp: number;
    spiritStones: number;
    contribution?: number;
    items?: ItemReward[];
    reputation?: { faction: string; amount: number }[];
    unlocks?: string[]; // Skills, áreas, etc.
  };
  
  // Opções
  timeLimit?: number; // Em minutos
  repeatable: boolean;
  choices?: QuestChoice[]; // Para quests com múltiplos caminhos
}

interface QuestObjective {
  id: string;
  type: 'kill' | 'collect' | 'talk' | 'explore' | 'craft' | 'use' | 'survive';
  target: string;
  amount: number;
  current: number;
  optional?: boolean;
}
```

---

## 👥 PARTE 3: NPCs E REPUTAÇÃO

### 3.1 NPCs Principais

#### Seita da Espada Celestial

| NPC | Título | Função | Localização |
|-----|--------|--------|-------------|
| **Mestre Xuanming** | Líder da Seita | Quest giver principal | Salão Central |
| **Ancião Qingfeng** | Instrutor de Espada | Treino de skills | Arena de Treino |
| **Ancião Huoyan** ⚠️ | Mestre de Fogo (CORROMPIDO) | Antagonista Arco 2 | Pavilhão do Fogo |
| **Discípula Mei Lin** ✅ | Rival/Aliada | Side quests, romance | Jardim de Meditação |
| **Li Wei** | Ferreiro da Seita | Crafting, reforging | Forja |
| **Wang Alquimista** ✅ | Mestre de Pílulas | Consumíveis, side quests | Laboratório |
| **Guardião Chen** | Capitão da Guarda | Bounties | Portão Principal |
| **Escriba Zhang** ✅ | Bibliotecário | Lore, técnicas secretas, investigação | Biblioteca |

#### NPCs Implementados com Diálogos Completos ✅

| NPC | ID | Zona | Papel na História |
|-----|-----|------|-------------------|
| Elder Moyin | shadow_elder_moyin | Vale das Sombras (-3,-3) | Aliado improvável, ensina artes sombrias |
| Mei Lin | disciple_mei_lin | Biblioteca (0,1) | Rival → Amiga, arco de 3 quests |
| Alchemist Wang | alchemist_wang | Laboratório (0,2) | Quests de alquimia, consome recursos |
| Scribe Zhang | scribe_zhang | Biblioteca (0,1) | Investigação da corrupção, lore profundo |
| Hermit Zhang | hermit_zhang | Pântano (-1,-4) | Sábio louco, profecias crípticas |
| Elder Huoyan (Corrupted) | elder_huoyan_corrupted | Pavilhão Sombrio | Antagonista do Arco 2 |

#### Facções Externas

| NPC | Facção | Função | Atitude Inicial |
|-----|--------|--------|-----------------|
| **Princesa Yue** | Império | Quests políticas | Neutra |
| **Demónio Xue** | Vale das Sombras | Antagonista/Aliado | Hostil |
| **Mestre Liu** | Punho de Ferro | Treino corpo | Neutra |
| **Fada Ling** | Mil Flores | Ilusões, romance | Amigável |
| **Monge Kongming** | Dragão Dourado | Sabedoria | Amigável |

---

### 3.2 Sistema de Reputação

**6 Facções com Reputação:**

| Facção | Hostil | Neutro | Amigável | Honrado | Exaltado |
|--------|--------|--------|----------|---------|----------|
| Espada Celestial | <-3000 | -3000 a 0 | 0 a 3000 | 3000 a 10000 | >10000 |
| Império Tianyun | <-3000 | -3000 a 0 | 0 a 3000 | 3000 a 10000 | >10000 |
| Aliança Justa | <-3000 | -3000 a 0 | 0 a 3000 | 3000 a 10000 | >10000 |
| Caminho Demoníaco | <-3000 | -3000 a 0 | 0 a 3000 | 3000 a 10000 | >10000 |
| Comerciantes | <-1000 | -1000 a 0 | 0 a 1000 | 1000 a 5000 | >5000 |
| Ermitões | <-500 | -500 a 0 | 0 a 500 | 500 a 2000 | >2000 |

**Benefícios por Nível:**

| Nível | Benefício |
|-------|-----------|
| Amigável | Desconto 5%, novas quests |
| Honrado | Desconto 15%, items exclusivos |
| Exaltado | Desconto 25%, mount/pet, título |

---

### 3.3 Sistema de Relacionamento (NPCs Especiais)

**5 NPCs com sistema de relacionamento profundo:**

1. **Mei Lin** (Rival → Amiga → Romance opcional)
2. **Xiao Yan** (Discípulo mais novo, mentor)
3. **Ancião Qingfeng** (Mestre, herança)
4. **Fada Ling** (Mistério, possível traição)
5. **Demónio Xue** (Inimigo → Aliado improvável)

**Níveis de Relacionamento:**
- Estranho → Conhecido → Amigo → Confidente → (Romance/Mestre/Irmão)

**Eventos Especiais:**
- Conversas diárias (+5 afinidade)
- Presentes (+10-50 afinidade)
- Quests conjuntas (+100 afinidade)
- Decisões de história (±200 afinidade)

---

## 🏆 PARTE 4: REWARDS E PROGRESSÃO

### 4.1 Tabela de Rewards por Tipo de Quest

| Tipo | EXP Base | Spirit Stones | Items |
|------|----------|---------------|-------|
| Daily | 50-200 | 50-200 | Materiais |
| Side | 100-500 | 100-500 | Uncommon+ |
| Bounty D | 200 | 100 | Common |
| Bounty C | 500 | 300 | Uncommon |
| Bounty B | 1000 | 800 | Rare |
| Bounty A | 2500 | 2000 | Epic |
| Bounty S | 5000 | 5000 | Legendary chance |
| Main | 300-1000 | 200-1000 | Story items |
| Trial | 3000 | 1000 | Ultimate Skill |

### 4.2 Títulos Desbloqueáveis

| Título | Requisito | Bónus |
|--------|-----------|-------|
| Discípulo Dedicado | 30 dias de daily quests | +5% EXP |
| Caçador de Recompensas | 50 bounties completas | +10% SS de bounties |
| Herói da Seita | Completar Arco 3 | +5% Reputation all |
| Lenda Viva | Completar todos os trials | +10% todas as stats |
| Salvador do Mundo | Completar main story | Título visual épico |

### 4.3 Achievements (100 total)

**Categorias:**
- 🗡️ Combate (20 achievements)
- 📜 História (15 achievements)
- 🔨 Crafting (15 achievements)
- 🗺️ Exploração (20 achievements)
- 👥 Social (15 achievements)
- 🏆 Maestria (15 achievements)

---

## 💾 PARTE 5: IMPLEMENTAÇÃO TÉCNICA

### 5.1 Estrutura de Dados

```typescript
// questSystem.ts
interface PlayerQuestState {
  activeQuests: Quest[];
  completedQuests: string[];
  dailyProgress: {
    date: string;
    completed: number;
    streak: number;
  };
  bountyProgress: {
    rank: 'D' | 'C' | 'B' | 'A' | 'S';
    completed: number;
    currentBounty: Quest | null;
  };
  reputation: Record<string, number>;
  relationships: Record<string, number>;
}

// npcSystem.ts
interface NPC {
  id: string;
  name: string;
  title: string;
  faction: string;
  location: string;
  dialogue: DialogueTree;
  quests: string[];
  shop?: ShopInventory;
  relationship?: RelationshipData;
}
```

### 5.2 Ficheiros a Criar

| Ficheiro | Descrição | Linhas Est. |
|----------|-----------|-------------|
| `questSystem.ts` | Core do sistema de quests | ~500 |
| `questDatabase.ts` | Todas as quests definidas | ~2000 |
| `npcSystem.ts` | Sistema de NPCs | ~300 |
| `npcDatabase.ts` | Todos os NPCs | ~800 |
| `reputationSystem.ts` | Sistema de facções | ~200 |
| `dialogueSystem.ts` | Sistema de diálogos | ~400 |
| `loreDatabase.ts` | Textos de lore | ~1000 |

### 5.3 UI Components a Criar

| Componente | Descrição |
|------------|-----------|
| `QuestLog.tsx` | Lista de quests activas |
| `QuestTracker.tsx` | Mini-tracker no HUD |
| `QuestDetails.tsx` | Modal de detalhes |
| `NPCDialog.tsx` | Interface de diálogo |
| `ReputationPanel.tsx` | Painel de reputação |
| `BountyBoard.tsx` | Painel de bounties |

---

## 📅 PARTE 6: ROADMAP DE IMPLEMENTAÇÃO

### Fase 1: Core Systems (2-3 semanas)
- [ ] Quest data structure
- [ ] Quest tracking state
- [ ] Quest UI básica (log, tracker)
- [ ] 10 quests de teste

### Fase 2: NPCs e Diálogos (1-2 semanas)
- [ ] NPC data structure
- [ ] Dialogue system
- [ ] 10 NPCs principais
- [ ] Shop integration

### Fase 3: Daily & Bounty (1 semana)
- [ ] Daily quest generator
- [ ] Bounty board UI
- [ ] Reset system
- [ ] 20 templates de daily/bounty

### Fase 4: Main Story Arc 1-2 (2 semanas)
- [ ] 20 main quests
- [ ] Cutscenes/narrativa
- [ ] Boss encounters
- [ ] Escolhas com consequências

### Fase 5: Side Quests & Reputation (2 semanas)
- [ ] 50 side quests iniciais
- [ ] Sistema de reputação completo
- [ ] Relationship system
- [ ] Faction benefits

### Fase 6: Polish & Content (ongoing)
- [ ] Remaining 100+ quests
- [ ] Lore entries
- [ ] Achievements
- [ ] Balance testing

---

## ✅ PARTE 7: CHECKLIST DE VALIDAÇÃO

### Combate (Já Implementado)
- [x] 51 skills funcionais
- [x] 12 passivas funcionais
- [x] Sistema de elementos
- [x] Buffs/Debuffs
- [x] Pity system
- [x] Floating damage
- [x] Turn indicator
- [x] Hotkeys

### Para Implementar
- [x] Quest system core ✅
- [x] NPC system ✅
- [x] Dialogue system ✅
- [ ] Reputation system
- [ ] Daily reset
- [ ] Bounty board
- [x] Main story Arc 1 ✅ (5 quests)
- [x] Main story Arc 2 ✅ (5 quests)
- [ ] Main story Arc 3-5
- [x] Side quests iniciais ✅ (8 implementadas)
- [ ] Side quests (150 total)
- [ ] Achievements (100)
- [ ] Titles system
- [ ] Relationship system

### Componentes UI Implementados ✅
- [x] QuestPanel.tsx - Journal completo com tabs
- [x] QuestHudTracker.tsx - Tracker compacto no HUD
- [x] Retratos de NPCs com diálogos
- [x] Objectivos com barras de progresso
- [x] Sistema de tipos de quest (main/side/daily/bounty)

---

## 📝 NOTAS FINAIS

### Princípios de Design
1. **Autenticidade Wuxia** - Cada quest deve sentir-se como parte de uma novel de cultivo
2. **Escolhas Significativas** - Decisões afectam reputação e história
3. **Progressão Satisfatória** - Sempre algo para fazer, nunca grinding vazio
4. **Lore Integrado** - História contada através de gameplay, não walls of text
5. **Respeito pelo Tempo** - Dailies em 15-30 min, sessões longas opcionais

### Estimativa Final de Conteúdo

| Categoria | Quantidade | Horas |
|-----------|------------|-------|
| Main Quests | 50 | 45h |
| Side Quests | 150 | 75h |
| Daily Quests | 20 tipos × 365 dias | 100h+ |
| Bounties | 100 | 50h |
| Trials | 12 | 30h |
| Exploration | 18 zonas | 30h |
| Reputation Grind | 6 facções | 25h |
| Relationships | 5 NPCs | 15h |
| **TOTAL ESTIMADO** | - | **370h** |

---

*GDD v1.0 - Janeiro 2026*
*WuxiaMUD Development Team*
