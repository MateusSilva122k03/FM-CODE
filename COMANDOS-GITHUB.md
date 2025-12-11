# 🚀 Comandos para Subir o FlowMaster no GitHub

Execute estes comandos no seu PowerShell (onde o Git está funcionando).

## Opção 1: Usar o Script Automático (Recomendado)

```powershell
# Navegar para o projeto
cd c:\Users\tonic\.gemini\antigravity\scratch\flowmaster

# Executar o script
.\setup-github.ps1
```

O script vai:
- ✅ Verificar se o Git está instalado
- ✅ Configurar seu nome e email
- ✅ Inicializar o repositório
- ✅ Fazer o commit inicial
- ✅ Conectar ao GitHub
- ✅ Fazer push do código

---

## Opção 2: Comandos Manuais

### 1. Configurar Git (primeira vez)

```powershell
# Configure seu nome
git config --global user.name "Seu Nome Completo"

# Configure seu email (mesmo do GitHub)
git config --global user.email "seu.email@exemplo.com"

# Verificar configuração
git config --list
```

### 2. Criar Repositório no GitHub

1. Acesse: https://github.com
2. Clique em **"+"** > **"New repository"**
3. Nome: **flowmaster**
4. **NÃO** marque "Initialize with README"
5. Clique em **"Create repository"**

### 3. Inicializar Git Localmente

```powershell
# Navegar para o projeto
cd c:\Users\tonic\.gemini\antigravity\scratch\flowmaster

# Inicializar Git
git init

# Adicionar todos os arquivos
git add .

# Verificar o que será commitado
git status

# Fazer o primeiro commit
git commit -m "Initial commit: FlowMaster multi-tenant workflow system"
```

### 4. Conectar ao GitHub

**Substitua `SEU_USUARIO` pelo seu username do GitHub:**

```powershell
# Adicionar repositório remoto
git remote add origin https://github.com/SEU_USUARIO/flowmaster.git

# Verificar
git remote -v

# Renomear branch para main
git branch -M main

# Enviar para o GitHub
git push -u origin main
```

### 5. Autenticação

Quando pedir credenciais:
- **Username**: Seu username do GitHub
- **Password**: Use um **Personal Access Token** (não sua senha)

#### Como criar Personal Access Token:

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** > **"Generate new token (classic)"**
3. Configure:
   - **Note**: `FlowMaster Development`
   - **Expiration**: 90 days
   - **Scopes**: Marque `repo` (todas as opções)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN** (você não verá novamente!)
6. Cole o token quando o Git pedir a senha

---

## ✅ Verificar Upload

Após o push, acesse:
```
https://github.com/SEU_USUARIO/flowmaster
```

Você deve ver todos os arquivos do projeto!

---

## 📝 Comandos Úteis para o Futuro

### Adicionar mudanças

```powershell
# Ver arquivos modificados
git status

# Adicionar arquivos específicos
git add arquivo.ts

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Descrição da mudança"

# Enviar para o GitHub
git push
```

### Trabalhar com branches

```powershell
# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Listar branches
git branch

# Mudar de branch
git checkout main

# Fazer push da nova branch
git push -u origin feature/nova-funcionalidade
```

### Atualizar do GitHub

```powershell
# Baixar e mesclar mudanças
git pull origin main
```

### Ver histórico

```powershell
# Ver histórico completo
git log

# Ver histórico resumido
git log --oneline

# Ver últimos 5 commits
git log -n 5
```

---

## 🛡️ Arquivos Protegidos

O `.gitignore` já está configurado para NÃO enviar:

- ✅ `node_modules/` - Dependências
- ✅ `.env` - Variáveis de ambiente sensíveis
- ✅ `dist/` e `build/` - Arquivos compilados
- ✅ `postgres-data/` - Dados do banco
- ✅ Logs e cache

---

## ❓ Problemas Comuns

### Erro: "remote origin already exists"

```powershell
git remote remove origin
git remote add origin https://github.com/SEU_USUARIO/flowmaster.git
```

### Erro: "failed to push"

```powershell
git pull origin main --rebase
git push origin main
```

### Erro: "Support for password authentication was removed"

**Solução**: Use Personal Access Token (veja seção 5)

---

## 🎯 Próximos Passos

Após subir no GitHub:

1. ✅ Adicionar badges ao README
2. ✅ Configurar GitHub Actions
3. ✅ Criar Issues para tarefas
4. ✅ Configurar branch protection
5. ✅ Adicionar colaboradores

---

**Dúvidas?** Consulte o guia completo em: `github-setup-guide.md`
