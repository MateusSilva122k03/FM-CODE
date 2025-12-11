# Arquitetura FlowMaster: Segurança e Multi-Tenancy

## 🎯 Objetivo
Construir o FlowMaster de forma segura e eficiente, garantindo isolamento total de dados entre barbearias (tenants).

## 🧱 Componentes Principais

### 1. PostgreSQL (O Cofre)
- Banco de dados central compartilhado.
- **Regra de Ouro**: Todas as tabelas de dados de clientes devem possuir a coluna `tenantId`.
- **Isolamento**: Dados de diferentes barbearias convivem mas nunca se misturam.

### 2. Prisma (O Kit de Ferramentas)
- **schema.prisma**: Definição das tabelas. Obrigatório incluir `tenantId` em models relevantes.
- **Prisma Migrate**: Aplica a estrutura no PostgreSQL.
- **Prisma Client**: Interface TypeScript para acesso ao banco.

## 🛡️ Arquitetura de Segurança (Anti-Violação)

Para evitar erro humano (esquecer o `where tenantId`), implementamos um escudo automático:

### 1. O Porteiro (Middleware: `ensureTenantContext`)
- **Quando**: Em cada requisição de API.
- **Ação**:
    1. Valida o Token JWT.
    2. Extrai o `tenantId` do usuário logado.
    3. Anexa o `tenantId` ao contexto da requisição.

### 2. O Escudo (Prisma Client Wrapper)
- **Quando**: Em qualquer operação de banco de dados (ex: `findMany`, `create`).
- **Ação**:
    1. Intercepta a chamada do código de negócio.
    2. Recupera o `tenantId` do contexto.
    3. **Injeta Forçadamente** o filtro `where: { tenantId: ... }` na query.
- **Resultado**: O desenvolvedor não precisa lembrar de filtrar por tenant; o sistema garante isso automaticamente.

## 🚀 Sprint 1: Foco
Implementar o sistema de segurança intransponível (Middleware + Wrapper).
