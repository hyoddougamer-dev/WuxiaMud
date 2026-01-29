# 🎨 PROMPTS BATCH PARA IMAGENS - 凌云道

**Última Atualização:** Janeiro 2026  
**Plataforma Recomendada:** Leonardo.AI, Midjourney, ou DALL-E 3

---

## 📊 ESTADO DOS ASSETS

### ✅ Já Temos (Não Precisamos Gerar):
- **Ícones de Cultivation:** 8 ícones ✅
- **VFX de Combate:** Spritesheet completo com 12 efeitos e 6 cores ✅
- **Avatares:** 20 (10M + 10F) ✅
- **Mobs:** 44 imagens ✅
- **Backgrounds:** 23 zonas ✅
- **Player Classes:** 12 sprites ✅
- **UI Frames:** 10 imagens ✅
- **Quest Icons:** 5 imagens ✅
- **World Map:** 1 imagem ✅

### ⚠️ Ainda Falta (Para Remover Emojis):
- **Combat Log Icons:** 12 ícones pequenos (32x32)

---

## ⚡ COMO USAR ESTE GUIA

### Leonardo.AI (Recomendado - Gratuito):
1. Vai a https://leonardo.ai
2. Cria conta gratuita (150 tokens/dia)
3. Usa modelo **"Leonardo Diffusion XL"** ou **"SDXL"**
4. Gera 4 imagens de cada vez
5. Faz download e renomeia

---

## ⚔️ COMBAT LOG ICONS (CRÍTICO - Remove Emojis)

**Precisamos de:** 12 ícones 32x32px com fundo transparente
**Guardar em:** `public/assets/icons/combat/`

### Batch 1 - Ações de Combate (4 ícones):
```
game icon set, 4 martial arts combat action icons, 32x32 pixels each:
1) crossed swords attack icon golden glow,
2) red anger symbol enemy strike,
3) orange explosion critical hit,
4) skull with flames critical damage,
transparent background, clean vector style, wuxia fantasy,
game UI icons, 32x32 each
```
**Guardar como:**
- `player_attack.png` (espadas cruzadas)
- `enemy_attack.png` (símbolo vermelho)
- `player_crit.png` (explosão)
- `enemy_crit.png` (caveira)

### Batch 2 - Status Effects (4 ícones):
```
game icon set, 4 martial arts status effect icons, 32x32 pixels each:
1) green glowing heart healing qi,
2) cyan upward arrow buff power up,
3) purple downward arrow debuff,
4) golden sparkles passive ability,
transparent background, clean vector style, wuxia fantasy,
game UI icons, 32x32 each
```
**Guardar como:**
- `heal.png` (coração verde)
- `buff.png` (seta cima)
- `debuff.png` (seta baixo)
- `passive.png` (brilhos)

### Batch 3 - Resultados (4 ícones):
```
game icon set, 4 martial arts result icons, 32x32 pixels each:
1) golden trophy with laurel victory,
2) running figure with speed lines flee,
3) yellow warning triangle,
4) tan scroll paper system message,
transparent background, clean vector style, wuxia fantasy,
game UI icons, 32x32 each
```
**Guardar como:**
- `victory.png` (troféu)
- `flee.png` (figura a correr)
- `warning.png` (triângulo)
- `system.png` (pergaminho)

---

## 🖼️ UI FRAMES - USAR CSS EM VEZ DE IMAGENS

### ❌ NÃO FAZER:
Gerar imagens de frames PNG (causa problemas de layout)

### ✅ FAZER:
Usar classes Tailwind para criar frames visuais:

```tsx
// Frame Dourado Elegante
<div className="
  relative p-4
  border-2 border-amber-500/60 
  bg-gradient-to-b from-amber-900/20 to-black/80
  rounded-lg
  shadow-lg shadow-amber-500/20
">
  {children}
</div>

// Frame com Brilho
<div className="
  relative p-4
  border border-amber-400/40
  bg-black/60 backdrop-blur-sm
  rounded-xl
  ring-1 ring-amber-500/20
  before:absolute before:inset-0 
  before:bg-gradient-to-t before:from-amber-500/5 before:to-transparent
  before:rounded-xl before:pointer-events-none
">
  {children}
</div>

// Tooltip Frame
<div className="
  bg-gradient-to-br from-slate-800 to-slate-900
  border border-amber-500/30
  rounded-lg shadow-xl
  p-3
">
  {children}
</div>
```

---

## ✨ TOOLTIPS COM GLOW POR RARIDADE (JÁ IMPLEMENTADO)

O sistema de tooltips agora tem visual **BANG!** com:

| Raridade | Efeito Visual |
|----------|---------------|
| **Mortal** | Borda cinza simples |
| **Earth** | Borda verde + sombra suave |
| **Heaven** | Borda azul + glow pulsante |
| **Spirit** | Borda roxa + glow animado |
| **Immortal** | Borda dourada + shine intenso + cantos decorados |

Classes CSS disponíveis em `index.css`:
- `animate-pulse-subtle` - Pulso suave (Heaven)
- `animate-spirit-glow` - Glow roxa (Spirit)
- `animate-immortal-shine` - Brilho dourado (Immortal)

---

## 📋 CHECKLIST FINAL

### Alta Prioridade (Remove Emojis):
- [ ] Combat Icons Batch 1 (4 ícones)
- [ ] Combat Icons Batch 2 (4 ícones)
- [ ] Combat Icons Batch 3 (4 ícones)

### Já Completo:
- [x] World Map (1)
- [x] Cultivation Icons (8)
- [x] VFX Combat (spritesheet)
- [x] Avatares (20)
- [x] Mobs (44)
- [x] Backgrounds (23)
- [x] Player Classes (12)
- [x] UI Frames (10)
- [x] Quest Icons (5)
- [x] **Tooltips BANG! Visual** ✨

---

## 🗂️ ESTRUTURA DE PASTAS

```
public/assets/
├── world_map.png                    ✅
├── icons/
│   ├── combat/                      ← CRIAR PASTA
│   │   ├── player_attack.png
│   │   ├── enemy_attack.png
│   │   ├── player_crit.png
│   │   ├── enemy_crit.png
│   │   ├── heal.png
│   │   ├── buff.png
│   │   ├── debuff.png
│   │   ├── passive.png
│   │   ├── victory.png
│   │   ├── flee.png
│   │   ├── warning.png
│   │   └── system.png
│   ├── cultivation/                 ✅
│   ├── quests/                      ✅
│   └── ui/                          ✅
```

---

**🎮 O projeto está quase completo visualmente!**
Tooltips já têm GLOW por raridade. Só falta gerar 12 ícones de combat log para remover emojis.
