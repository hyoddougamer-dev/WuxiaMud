# 🎮 凌云道 (Língyún Dào) - Setup de Autenticação

## 📋 O Que Vais Fazer

Vais criar uma conta gratuita no **Supabase** (plataforma de base de dados) e configurar o sistema de login do jogo.

⏱️ **Tempo:** 10-15 minutos  
💰 **Custo:** **GRÁTIS** (até 500MB de dados e 50.000 utilizadores mensais)

---

## 🚀 Passo 1: Criar Conta no Supabase

1. Vai a: **https://supabase.com**
2. Clica em **"Start your project"**
3. Regista-te com o teu **email do GitHub** (mais rápido) ou cria uma conta nova
4. Confirma o email que vais receber

✅ **Feito!** Tens uma conta Supabase.

---

## 🏗️ Passo 2: Criar um Projeto

1. No dashboard do Supabase, clica **"New Project"**
2. Preenche:
   - **Name:** `lingyundao` (ou o que quiseres)
   - **Database Password:** Cria uma password forte (guarda-a!)
   - **Region:** Escolhe `Europe (Frankfurt)` (mais perto de Portugal)
3. Clica **"Create new project"**
4. **Aguarda 2-3 minutos** enquanto cria a base de dados

✅ **Feito!** Tens o teu projeto.

---

## 🔑 Passo 3: Obter as Credenciais

1. No menu lateral, vai a **"Settings"** ⚙️
2. Clica em **"API"**
3. Vais ver 2 coisas importantes:

### 📍 **Project URL**
```
https://xxxxxxxxxx.supabase.co
```
**Copia isto!**

### 🔐 **anon/public key**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```
**Copia isto também!** (é uma chave longa)

✅ **Feito!** Tens as credenciais.

---

## 📝 Passo 4: Configurar o Ficheiro .env

1. Abre o ficheiro **`.env`** na raiz do projeto
2. Substitui os valores:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

3. **Guarda o ficheiro** (Ctrl+S)

✅ **Feito!** O jogo já está ligado ao Supabase.

---

## � Passo 4.5: Desativar Confirmação de Email (IMPORTANTE!)

**Por padrão, o Supabase obriga a confirmar o email. Vamos desativar isso para facilitar os testes:**

1. No Supabase, vai a **"Authentication"** (ícone de cadeado no menu lateral)
2. Clica em **"Settings"** (ou **"Providers"**)
3. Procura por **"Email"** e clica para expandir
4. Encontra a opção **"Confirm email"** ou **"Enable email confirmations"**
5. **DESATIVA** (toggle para OFF ou desmarca a checkbox)
6. Clica **"Save"** no final da página

✅ **Feito!** Agora podes criar contas sem confirmar email.

> **Nota:** Para produção, deves reativar isto e customizar o template do email em Authentication > Email Templates

---

## �🗄️ Passo 5: Criar as Tabelas na Base de Dados

1. No Supabase, vai ao **"SQL Editor"** (ícone de terminal no menu lateral)
2. Clica **"New query"**
3. **Cola este código SQL:**

```sql
-- Tabela de perfis de utilizadores
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Tabela de dados dos jogadores
CREATE TABLE player_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  character_slots JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: Criar perfil automaticamente quando alguém se regista
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Player_' || substring(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Políticas de segurança (RLS - Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_data ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ler perfis públicos
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Utilizadores podem actualizar o seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Utilizadores podem ler os seus próprios dados
CREATE POLICY "Users can view own player data"
  ON player_data FOR SELECT
  USING (auth.uid() = user_id);

-- Utilizadores podem actualizar os seus próprios dados
CREATE POLICY "Users can update own player data"
  ON player_data FOR UPDATE
  USING (auth.uid() = user_id);

-- Utilizadores podem inserir os seus próprios dados
CREATE POLICY "Users can insert own player data"
  ON player_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

4. Clica **"Run"** (ou pressiona Ctrl+Enter)
5. Deves ver **"Success. No rows returned"**

✅ **Feito!** A base de dados está pronta.

---

## ▶️ Passo 6: Testar o Sistema

1. Para o servidor se estiver a correr (Ctrl+C no terminal)
2. Inicia de novo: `npm run dev`
3. Abre o browser em **http://localhost:5173**
4. Deves ver a página de **Login/Register** linda! 🎨

### 🧪 Testa:
1. Clica em **"Register"**
2. Preenche um email, username e password (mínimo 6 caracteres)
3. Clica **"Create Account"**
4. **SEM CONFIRMAÇÃO DE EMAIL!** Deves fazer login automaticamente
5. Cria o teu primeiro personagem (nome, avatar, classe)
6. Completa o tutorial ou skip
7. Começa a jogar!

### 💾 Verifica que está a funcionar:
- No Supabase, vai a **"Table Editor"** → **"player_data"**
- Deves ver uma linha com o teu `user_id` e `character_slots` com dados JSON
- Os teus personagens estão guardados online! ☁️

✅ **TUDO A FUNCIONAR!** 🎉

---

## 🔧 Resolução de Problemas

### ❌ Erro: "Invalid API key"
- Verifica se copiaste a chave `anon/public` correcta
- Confirma que o ficheiro `.env` está guardado
- Reinicia o servidor (`npm run dev`)

### ❌ Erro: "Failed to fetch"
- Verifica se o URL do Supabase está correcto
- Confirma que tens internet
- Verifica se o projeto no Supabase está activo (verde)

### ❌ Erro: "relation profiles does not exist"
- Volta ao SQL Editor e corre o código SQL novamente
- Confirma que não houve erros ao executar

### ❌ Página em branco
- Abre a consola do browser (F12)
- Partilha os erros que aparecem

---

## 📚 O Que Acabaste de Fazer

✅ Criaste uma base de dados PostgreSQL gratuita  
✅ Configuraste autenticação segura com JWT tokens  
✅ Criaste tabelas para perfis e dados dos jogadores  
✅ Configuraste segurança (RLS) para proteger os dados  
✅ Ligaste o jogo à cloud (os dados ficam online)  

**Agora os jogadores podem:**
- Criar conta e fazer login
- Ter os dados guardados online
- Jogar em qualquer dispositivo
- Ter progresso sincronizado

---

## 🎯 Próximos Passos (Melhorias Futuras)

- [ ] Adicionar login com Google OAuth
- [ ] Sistema de recuperação de password
- [ ] Verificação de email obrigatória
- [ ] Avatar upload para S3/Cloudinary
- [ ] 2FA (autenticação de dois factores)
- [ ] Ranking global de jogadores
- [ ] Chat entre jogadores
- [ ] Sistema de amigos

---

**🎮 Boa sorte, Cultivador!**
