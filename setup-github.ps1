# Script para configurar Git e subir o FlowMaster para o GitHub
# Execute este script no PowerShell onde o Git está funcionando

Write-Host "=== Configuração do Git e Upload para GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se o Git está instalado
Write-Host "1. Verificando instalação do Git..." -ForegroundColor Yellow
git --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Git não encontrado. Certifique-se de que o Git está instalado." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Git instalado com sucesso!" -ForegroundColor Green
Write-Host ""

# Configurar usuário Git (se ainda não configurado)
Write-Host "2. Configurando usuário Git..." -ForegroundColor Yellow
$currentName = git config --global user.name
$currentEmail = git config --global user.email

if ([string]::IsNullOrWhiteSpace($currentName)) {
    $userName = Read-Host "Digite seu nome completo"
    git config --global user.name "$userName"
    Write-Host "✓ Nome configurado: $userName" -ForegroundColor Green
} else {
    Write-Host "✓ Nome já configurado: $currentName" -ForegroundColor Green
}

if ([string]::IsNullOrWhiteSpace($currentEmail)) {
    $userEmail = Read-Host "Digite seu email (mesmo do GitHub)"
    git config --global user.email "$userEmail"
    Write-Host "✓ Email configurado: $userEmail" -ForegroundColor Green
} else {
    Write-Host "✓ Email já configurado: $currentEmail" -ForegroundColor Green
}
Write-Host ""

# Navegar para o diretório do projeto
Write-Host "3. Navegando para o diretório do projeto..." -ForegroundColor Yellow
Set-Location "c:\Users\tonic\.gemini\antigravity\scratch\flowmaster"
Write-Host "✓ Diretório: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Inicializar repositório Git
Write-Host "4. Inicializando repositório Git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✓ Repositório Git já inicializado" -ForegroundColor Green
} else {
    git init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Repositório Git inicializado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "ERRO ao inicializar repositório" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Adicionar arquivos
Write-Host "5. Adicionando arquivos ao staging..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Arquivos adicionados com sucesso!" -ForegroundColor Green
} else {
    Write-Host "ERRO ao adicionar arquivos" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verificar status
Write-Host "6. Verificando status dos arquivos..." -ForegroundColor Yellow
git status --short
Write-Host ""

# Fazer commit
Write-Host "7. Criando commit inicial..." -ForegroundColor Yellow
git commit -m "Initial commit: FlowMaster multi-tenant workflow system"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "ERRO ao criar commit" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Solicitar informações do GitHub
Write-Host "8. Configurando repositório remoto..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE: Antes de continuar, você precisa:" -ForegroundColor Cyan
Write-Host "  1. Acessar https://github.com" -ForegroundColor White
Write-Host "  2. Clicar em '+' > 'New repository'" -ForegroundColor White
Write-Host "  3. Nome do repositório: flowmaster" -ForegroundColor White
Write-Host "  4. NÃO marcar 'Initialize with README'" -ForegroundColor White
Write-Host "  5. Clicar em 'Create repository'" -ForegroundColor White
Write-Host ""

$githubUsername = Read-Host "Digite seu username do GitHub"
$repoUrl = "https://github.com/$githubUsername/flowmaster.git"

Write-Host "URL do repositório: $repoUrl" -ForegroundColor Cyan
Write-Host ""

# Verificar se o remote já existe
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "Remote 'origin' já existe: $existingRemote" -ForegroundColor Yellow
    $replace = Read-Host "Deseja substituir? (s/n)"
    if ($replace -eq 's' -or $replace -eq 'S') {
        git remote remove origin
        git remote add origin $repoUrl
        Write-Host "✓ Remote atualizado!" -ForegroundColor Green
    }
} else {
    git remote add origin $repoUrl
    Write-Host "✓ Remote adicionado!" -ForegroundColor Green
}
Write-Host ""

# Renomear branch para main
Write-Host "9. Renomeando branch para 'main'..." -ForegroundColor Yellow
git branch -M main
Write-Host "✓ Branch renomeada para 'main'" -ForegroundColor Green
Write-Host ""

# Push para GitHub
Write-Host "10. Enviando código para o GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "ATENÇÃO: Você precisará autenticar no GitHub." -ForegroundColor Cyan
Write-Host "  - Use seu Personal Access Token (não a senha)" -ForegroundColor White
Write-Host "  - Para criar um token: https://github.com/settings/tokens" -ForegroundColor White
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ SUCESSO! Projeto enviado para o GitHub!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Acesse seu repositório em:" -ForegroundColor Cyan
    Write-Host "https://github.com/$githubUsername/flowmaster" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERRO ao fazer push para o GitHub" -ForegroundColor Red
    Write-Host "Verifique suas credenciais e tente novamente" -ForegroundColor Yellow
    Write-Host ""
}
