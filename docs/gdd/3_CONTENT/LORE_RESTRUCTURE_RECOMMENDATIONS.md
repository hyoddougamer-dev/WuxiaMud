# 🏔️ Wuxia MUD - Lore Restructure & World Building

## 📖 Conceito Central

### O Mundo: "Jianghu das Nove Tribulações"
O mundo existe num plano entre o mortal e o imortal. Cultivadores viajam pelo **Jianghu** (o mundo das artes marciais), enfrentando **Nove Tribulações** para alcançar a imortalidade. Cada realm representa uma tribulação superada.

---

## 🗺️ Estrutura de Zonas

### Hierarquia Geográfica
```
Continente Celestial (End-game)
├── Montanhas do Dragão Celestial (Realm 10+)
│   ├── Pico do Trovão (Boss: Ancestral Celeste)
│   └── Vale das Almas Perdidas
│
├── Planícies do Fogo (Realm 7-9)
│   ├── Vulcão Carmesim (Boss: Senhor do Magma)
│   ├── Deserto de Cinzas
│   └── Oásis Escarlate
│
├── Floresta do Vento (Realm 4-6)
│   ├── Bosque dos Espíritos (Boss: Anciã da Névoa)
│   ├── Clareira Sagrada
│   └── Árvore Milenar
│
└── Vale Mortal (Realm 1-3) [STARTER ZONE]
    ├── Aldeia Jade Verde (Hub)
    ├── Colinas do Lótus Branco
    ├── Cavernas do Início (Tutorial)
    └── Templo Abandonado (Boss: Monge Caído)
```

---

## 👤 Sistema de NPCs

### Categorias de NPCs

#### 1. Mestres de Cultivo
Cada classe tem um mestre que fornece quests de progressão.

| Classe | Mestre | Localização | Personalidade |
|--------|--------|-------------|---------------|
| Sword Saint | Lao Jian (老剑) | Pico da Espada | Estóico, poucos palavras |
| Jade Palm | Mestra Yù (玉师) | Pavilhão de Jade | Maternal, sábia |
| Iron Body | Tiě Shān (铁山) | Forja Ancestral | Rude, testador |
| Shadow Walker | Sombra Ying (影) | Desconhecido | Misterioso, aparece aleatoriamente |
| Spirit Caller | Líng Wú (灵巫) | Altar dos Espíritos | Excêntrico, fala com espíritos |
| Elemental Fist | Huǒ Quán (火拳) | Cratera do Fogo | Impulsivo, competitivo |

#### 2. Mercadores
| Nome | Vende | Localização | História |
|------|-------|-------------|----------|
| Comerciante Chen | Items básicos, consumíveis | Aldeia Jade Verde | Ex-cultivador, perdeu cultivation após acidente |
| Ferreiro Wáng | Armas, armaduras | Forja da Aldeia | Discípulo de um Immortal Ferreiro |
| Alquimista Zhāng | Pills, elixires | Pagode do Elixir | Obcecado com a pílula perfeita |
| Vendedor Sombrio | Items raros (rotação) | Aparece aleatoriamente | Ninguém sabe quem ele é |

#### 3. Quest Givers
| Nome | Tipo de Quests | Arc Narrativo |
|------|----------------|---------------|
| Anciã Míng | Tutorial, progressão | Guarda os segredos da aldeia |
| Capitão Zhōu | Defesa, mobs | Protector da fronteira |
| Caçador Lin | Hunting, gathering | Rastreia monstros raros |
| Curandeira Hé | Side quests | Precisa de ingredientes para curas |

---

## 👹 Sistema de Mobs

### Estrutura de Progressão

#### Vale Mortal (Realm 1-3)
| Mob | Realm | Elemento | Drop |
|-----|-------|----------|------|
| Lobo Selvagem | 1 | Physical | Pele, Garra |
| Javali Furioso | 1-2 | Physical | Presa, Carne |
| Espírito Menor | 2 | Spirit | Essência Espiritual |
| Bandido Comum | 2-3 | Physical | Ouro, Arma Quebrada |
| Fantasma Errante | 3 | Void | Ectoplasma, Fragmento de Alma |

#### Floresta do Vento (Realm 4-6)
| Mob | Realm | Elemento | Drop |
|-----|-------|----------|------|
| Serpente do Vento | 4 | Wind | Escama, Veneno |
| Tigre Branco | 4-5 | Physical | Pele Mágica, Garra de Tigre |
| Árvore Corrompida | 5 | Wood | Madeira Anciã, Seiva |
| Cultivador Renegado | 5-6 | Varies | Técnica Fragmentada |
| Demónio Menor | 6 | Void | Núcleo Demoníaco |

#### Planícies do Fogo (Realm 7-9)
| Mob | Realm | Elemento | Drop |
|-----|-------|----------|------|
| Salamandra de Fogo | 7 | Fire | Coração de Fogo |
| Golem de Lava | 7-8 | Fire/Earth | Núcleo de Magma |
| Fénix Corrompida | 8 | Fire | Pena Carmesim |
| Elemental de Chamas | 8-9 | Fire | Essência do Fogo |
| Demónio do Vulcão | 9 | Fire/Void | Coração Vulcânico |

---

## 🐉 Sistema de Bosses

### World Bosses (Respawn: 24-48h)

#### 1. Monge Caído (Vale Mortal)
**Realm**: 3-4  
**Historia**: Ex-líder do Templo Abandonado, corrompido por técnica proibida  
**Mecânicas**:
- **Fase 1**: Ataques de palma sagrada (50-100% HP)
- **Fase 2**: Invoca monges fantasma (30-50% HP)
- **Fase 3**: Forma corrompida, ataques void (0-30% HP)

**Drops**: Técnica do Monge Caído, Colar de Contas Corrompidas

#### 2. Anciã da Névoa (Floresta do Vento)
**Realm**: 6-7  
**Historia**: Espírito da floresta, protectora corrompida pelo Demónio  
**Mecânicas**:
- Envolve arena em névoa (visão reduzida)
- Invoca clones ilusórios
- Cura-se ao tocar nas árvores

**Drops**: Manto da Névoa, Anel do Espírito da Floresta

#### 3. Senhor do Magma (Planícies do Fogo)
**Realm**: 9-10  
**Historia**: Elemental ancestral, despertado pela ganância dos cultivadores  
**Mecânicas**:
- Chão fica em lava (precisas posicionar-te)
- Erupções periódicas
- Absorve fire damage e cura-se

**Drops**: Núcleo do Magma, Armadura Flamejante

#### 4. Ancestral Celeste (Montanhas do Dragão)
**Realm**: 12+  
**Historia**: O primeiro cultivador a falhar a ascensão, preso entre planos  
**Mecânicas**:
- Alterna entre 5 elementos
- Lightning que atravessa arena
- Precisa coordenação de grupo

**Drops**: Arma Celestial, Pergaminho da Ascensão

---

## 📜 Arcs de Quest Principais

### Arc 1: O Caminho do Cultivador (Realm 1-3)
1. **Tutorial**: Despertar do cultivation
2. **Quest da Aldeia**: Ajudar NPCs locais
3. **Primeira Tribulação**: Enfrentar o medo (boss solo)
4. **Revelação**: O Monge Caído revela a corrupção que se espalha

### Arc 2: Sombras na Floresta (Realm 4-6)
1. **Investigação**: Descobrir fonte da corrupção
2. **Aliados Inesperados**: Conhecer facção secreta
3. **A Anciã**: Salvar ou destruir a Anciã da Névoa
4. **Decisão**: Escolha que afecta reputação com facções

### Arc 3: Fogo Purificador (Realm 7-9)
1. **Viagem ao Vulcão**: Atravessar o deserto
2. **Provação do Fogo**: Testes de resistência
3. **O Senhor Adormecido**: Despertar do boss
4. **Sacrifício**: Um NPC importante morre ou é salvo

### Arc 4: Ascensão (Realm 10+)
1. **Reunir Fragmentos**: Colectar items de todos os bosses
2. **Portal Celestial**: Abrir caminho às montanhas
3. **Tribulação Final**: Enfrentar o próprio demónio interior
4. **Confronto**: Batalha com o Ancestral Celeste
5. **Escolha Final**: Ascender ou permanecer no mortal

---

## 🏛️ Sistema de Facções

### Facções Principais

#### 1. Seita do Lótus Branco (Ordem)
- **Filosofia**: Justiça, proteção dos fracos
- **Bónus**: +10% healing, +5% defesa
- **Inimigos**: Seita do Véu Negro
- **Reputação**: Ganhas ao ajudar NPCs e derrotar demónios

#### 2. Seita do Véu Negro (Caos)
- **Filosofia**: Poder a qualquer custo
- **Bónus**: +15% damage, -10% defesa
- **Inimigos**: Seita do Lótus Branco
- **Reputação**: Ganhas ao fazer escolhas "más" e sacrifícios

#### 3. Círculo dos Comerciantes (Neutro)
- **Filosofia**: Ouro acima de tudo
- **Bónus**: -10% preços, +20% loot gold
- **Neutro com todos
- **Reputação**: Ganhas ao completar contratos

#### 4. Ermitas da Montanha (Solitário)
- **Filosofia**: Cultivation puro, sem interferência
- **Bónus**: +20% XP de meditation, +10% crafting
- **Neutro com todos
- **Reputação**: Ganhas ao meditar e craftar

---

## 💡 Recomendações de Implementação

### Fase 1 - Fundação (1-2 semanas)
1. Implementar sistema de zonas básico
2. Adicionar 3-5 NPCs core à aldeia inicial
3. Criar progression de mobs por realm
4. Implementar primeiro boss (Monge Caído)

### Fase 2 - Expansão (2-4 semanas)
1. Adicionar segunda zona (Floresta)
2. Implementar sistema de facções (reputação)
3. Criar quest chain do Arc 1
4. Adicionar segundo boss

### Fase 3 - Profundidade (4-8 semanas)
1. Adicionar terceira e quarta zona
2. Implementar escolhas com consequências
3. Criar eventos mundiais (boss spawns)
4. Sistema de achievements ligado à lore

### Fase 4 - End-game (ongoing)
1. Raids de grupo
2. PvP com backstory
3. Eventos sazonais com lore
4. Expansões de história

---

## 📚 Nomenclatura Wuxia

### Termos a Usar
| Termo | Significado | Uso |
|-------|-------------|-----|
| Jianghu (江湖) | Mundo das artes marciais | Setting geral |
| Qi (气) | Energia vital | Mana, energia |
| Dao (道) | O caminho | Progressão, filosofia |
| Gongfu (功夫) | Habilidade marcial | Skills, técnicas |
| Xiān (仙) | Imortal | End-game status |
| Mó (魔) | Demónio | Enemies, corrupção |
| Zhēnrén (真人) | Pessoa verdadeira | Título de mestres |

### Naming Conventions
- **NPCs**: Nome chinês + título (Mestre X, Anciã Y)
- **Mobs**: [Adjetivo] + [Criatura] (Lobo Selvagem, Serpente do Vento)
- **Bosses**: [Título] + [Epíteto] (Senhor do Magma, Anciã da Névoa)
- **Items**: [Material/Origem] + [Tipo] (Espada do Jade, Pílula do Dragão)
- **Skills**: [Elemento/Estilo] + [Acção] (Palma de Jade, Passo das Sombras)

---

## 🎯 Próximos Passos Imediatos

1. **Revisar quests existentes** e alinhar com esta estrutura
2. **Criar ficheiro de dados** para NPCs com diálogos
3. **Expandir loot tables** dos mobs com drops temáticos
4. **Implementar primeiro boss** com fases
5. **Adicionar zona hub** (Aldeia Jade Verde) como ponto central
