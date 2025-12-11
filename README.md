# 💈 FlowMaster

> Sistema de gerenciamento de fluxos de trabalho multi-tenant para a área de esttética, construído com Node.js, TypeScript, Prisma e PostgreSQL.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Características](#-características)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API](#-api)
- [Banco de Dados](#-banco-de-dados)
- [Segurança](#-segurança)
- [Desenvolvimento](#-desenvolvimento)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

**FlowMaster** é uma plataforma SaaS multi-tenant projetada para gerenciar fluxos de trabalho em barbearias. O sistema permite que múltiplas barbearias (tenants) utilizem a mesma infraestrutura, garantindo **isolamento total de dados** e segurança através de uma arquitetura robusta.

### Problema que Resolve

- ✅ Gerenciamento centralizado de agendamentos
- ✅ Controle de serviços e preços
- ✅ Gestão de usuários e permissões
- ✅ Isolamento completo de dados entre barbearias
- ✅ Escalabilidade para múltiplos tenants

---

## ✨ Características
- 🐳 **Docker**: Ambiente de desenvolvimento containerizado
- 🎨 **Clean Architecture**: Código organizado e manutenível
- 🧪 **Testável**: Arquitetura preparada para testes automatizados

---

## 🏗️ Arquitetura

O FlowMaster implementa uma arquitetura de segurança em camadas para garantir isolamento total de dados:

```mermaid
graph TD
    A[Cliente] -->|HTTP Request| B[Express Server]
    B -->|JWT Token| C[ensureTenantContext Middleware]
    C -->|tenantId| D[Prisma Client Wrapper]
    D -->|Auto-filtered Query| E[(PostgreSQL)]
    
    style C fill:#90EE90
    style D fill:#FFB6C1
    style E fill:#87CEEB
```

### Componentes de Segurança

1. **Middleware `ensureTenantContext`**: Extrai e valida o `tenantId` de cada requisição
2. **Prisma Client Wrapper**: Injeta automaticamente filtros de `tenantId` em todas as queries
3. **Schema Validation**: Todas as tabelas relevantes possuem `tenantId` obrigatório

> 📖 Para mais detalhes, consulte [docs/architecture.md](docs/architecture.md)

---

## 🛠️ Tecnologias

### Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Node.js** | 18+ | Runtime JavaScript |
| **TypeScript** | 5.9 | Superset tipado do JavaScript |
| **Express** | 5.2 | Framework web minimalista |
| **Prisma** | 5.22 | ORM moderno para TypeScript |
| **PostgreSQL** | 15 | Banco de dados relacional |

### DevOps

- **Docker** & **Docker Compose**: Containerização
- **ts-node**: Execução de TypeScript em desenvolvimento
- **nodemon**: Hot reload durante desenvolvimento

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### Verificar Instalação

```bash
node --version   # v18.0.0 ou superior
docker --version # Docker version 20.10.0 ou superior
git --version    # git version 2.30.0 ou superior
```

---

## 🚀 Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/SEU_USUARIO/flowmaster.git
cd flowmaster
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` no diretório `backend/`:

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/flowmaster?schema=public"
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-in-production
```

### 3. Iniciar o Banco de Dados

```bash
# Voltar para a raiz do projeto
cd ..

# Iniciar PostgreSQL com Docker
docker-compose up -d
```

### 4. Instalar Dependências

```bash
cd backend
npm install
```

### 5. Executar Migrations

```bash
npx prisma migrate dev --name init
```

### 6. (Opcional) Popular o Banco de Dados

```bash
npm run seed
```

---

## 🎮 Uso

### Iniciar o Servidor de Desenvolvimento

```bash
cd backend
npm run dev
```

O servidor estará disponível em: **http://localhost:3000**

### Comandos Disponíveis

```bash
# Desenvolvimento com hot reload
npm run dev

# Popular banco de dados
npm run seed

# Executar testes
npm test

# Gerar Prisma Client
npx prisma generate

# Abrir Prisma Studio (GUI do banco)
npx prisma studio
```

---

## 📁 Estrutura do Projeto

```
flowmaster/
├── backend/                    # Backend Node.js/TypeScript
│   ├── src/
│   │   ├── config/            # Configurações centralizadas
│   │   │   ├── env.ts         # Variáveis de ambiente
│   │   │   └── index.ts       # Export index
│   │   ├── errors/            # Classes de erro customizadas
│   │   │   ├── AppError.ts    # Erros base da aplicação
│   │   │   └── index.ts       # Export index
│   │   ├── lib/
│   │   │   └── prisma.ts      # Prisma Client Wrapper
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts     # Autenticação JWT
│   │   │   └── tenantMiddleware.ts    # Middleware de tenant
│   │   ├── routes/            # Rotas da API
│   │   │   ├── auth.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── services.routes.ts
│   │   │   ├── professionals.routes.ts
│   │   │   └── appointments.routes.ts
│   │   ├── services/          # Lógica de negócio
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.service.ts
│   │   │   ├── services.service.ts
│   │   │   ├── professionals.service.ts
│   │   │   └── appointments.service.ts
│   │   ├── types/
│   │   │   └── express.d.ts   # Tipos customizados Express
│   │   └── server.ts          # Entrada da aplicação
│   ├── prisma/
│   │   ├── schema.prisma      # Schema do banco de dados
│   │   └── migrations/        # Migrations do Prisma
│   ├── scripts/
│   │   ├── seed.ts            # Script de seed
│   │   └── verify-sprint3.ts  # Testes de verificação
│   ├── .env.example           # Template de variáveis de ambiente
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Frontend (a ser implementado)
├── docs/
│   └── architecture.md        # Documentação da arquitetura
├── docker-compose.yml         # Configuração Docker
├── .gitignore
└── README.md
```

---

## 🔌 API

### Autenticação

Todas as rotas `/api/*` exigem autenticação via JWT. Inclua o token no header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Endpoints de Autenticação

```http
POST   /auth/register        # Registrar novo usuário
POST   /auth/login           # Login e obtenção de token JWT
GET    /api/users/profile    # Obter perfil do usuário autenticado
```

### Endpoints Principais

#### Tenants

```http
GET    /api/tenants          # Listar tenants
POST   /api/tenants          # Criar tenant
GET    /api/tenants/:id      # Buscar tenant
PUT    /api/tenants/:id      # Atualizar tenant
DELETE /api/tenants/:id      # Deletar tenant
```

#### Usuários

```http
GET    /api/users            # Listar usuários (do tenant atual)
POST   /api/users            # Criar usuário
GET    /api/users/:id        # Buscar usuário
PUT    /api/users/:id        # Atualizar usuário
DELETE /api/users/:id        # Deletar usuário
```

#### Profissionais

```http
GET    /api/professionals         # Listar profissionais (do tenant atual)
POST   /api/professionals         # Criar profissional
GET    /api/professionals/:id     # Buscar profissional
PUT    /api/professionals/:id     # Atualizar profissional
DELETE /api/professionals/:id     # Deletar profissional
```

#### Serviços

```http
GET    /api/services         # Listar serviços (do tenant atual)
POST   /api/services         # Criar serviço
GET    /api/services/:id     # Buscar serviço
PUT    /api/services/:id     # Atualizar serviço
DELETE /api/services/:id     # Deletar serviço
```

#### Agendamentos

```http
GET    /api/appointments     # Listar agendamentos (do tenant atual)
POST   /api/appointments     # Criar agendamento
GET    /api/appointments/:id # Buscar agendamento
PUT    /api/appointments/:id # Atualizar agendamento
DELETE /api/appointments/:id # Deletar agendamento
```

### Exemplo de Requisição

```bash
# Criar um novo serviço
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Corte de Cabelo",
    "price": 50.00,
    "duration": 30
  }'
```

---

## 🗄️ Banco de Dados

### Schema Principal

```prisma
model Tenant {
  id           String        @id @default(uuid())
  name         String
  users        User[]
  services     Service[]
  appointments Appointment[]
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
}

model Service {
  id           String        @id @default(uuid())
  name         String
  price        Decimal
  duration     Int
  tenantId     String
  tenant       Tenant        @relation(fields: [tenantId], references: [id])
  appointments Appointment[]
}

model Appointment {
  id        String            @id @default(uuid())
  date      DateTime
  status    AppointmentStatus @default(SCHEDULED)
  tenantId  String
  tenant    Tenant            @relation(fields: [tenantId], references: [id])
  serviceId String
  service   Service           @relation(fields: [serviceId], references: [id])
}
```

### Acessar Prisma Studio

```bash
npx prisma studio
```

Acesse: **http://localhost:5555**

---

## 🔒 Segurança

### Autenticação JWT

O FlowMaster utiliza **JSON Web Tokens (JWT)** para autenticação:

- 🔐 **Hashing de Senhas**: bcrypt com 10 salt rounds
- 🎫 **Tokens JWT**: Expiração de 7 dias
- 🔑 **Payload do Token**: Contém `userId`, `tenantId` e `email`
- 🛡️ **Middleware**: Valida token em todas as rotas `/api/*`

### Multi-Tenancy

O FlowMaster implementa **Row-Level Security** através de:

1. **Schema Design**: Todas as tabelas possuem `tenantId`
2. **Autenticação JWT**: Token contém `tenantId` do usuário
3. **Middleware Chain**: `authenticateJWT` → `ensureTenantContext`
4. **Prisma Wrapper**: Filtra automaticamente queries por `tenantId`

### Exemplo de Proteção Automática

```typescript
// ❌ SEM proteção (vulnerável)
const services = await prisma.service.findMany();

// ✅ COM proteção (automática via wrapper)
const services = await req.prisma.service.findMany();
// Automaticamente filtrado: WHERE tenantId = 'user-tenant-id-from-jwt'
```

### Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as /auth/login
    participant M as authenticateJWT
    participant T as ensureTenantContext
    participant D as Database
    
    C->>A: POST /auth/login (email, password)
    A->>D: Verificar credenciais
    D-->>A: Usuário válido
    A-->>C: JWT Token (userId, tenantId, email)
    
    C->>M: GET /api/services (Bearer Token)
    M->>M: Validar e decodificar JWT
    M->>T: req.user = {userId, tenantId, email}
    T->>T: req.prisma = getTenantClient(tenantId)
    T->>D: SELECT * FROM services WHERE tenantId = ?
    D-->>C: Serviços do tenant
```

### Roles e Permissões

```typescript
enum Role {
  USER        // Usuário comum
  ADMIN       // Administrador do tenant
  SUPERADMIN  // Administrador global
}
```

---

## 👨‍💻 Desenvolvimento

### Configurar Ambiente de Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar banco de dados
docker-compose up -d

# Executar migrations
npx prisma migrate dev

# Iniciar servidor em modo dev
npm run dev
```

### Executar Testes de Isolamento

```bash
ts-node scripts/test-isolation.ts
```

### Gerar Nova Migration

```bash
npx prisma migrate dev --name nome_da_migration
```

### Resetar Banco de Dados

```bash
npx prisma migrate reset
```

---

## 🗺️ Roadmap

### Sprint 1 ✅ (Concluído)
- [x] Setup do ambiente (Node.js, TypeScript, PostgreSQL)
- [x] Schema Prisma com multi-tenancy
- [x] Middleware `ensureTenantContext`
- [x] Prisma Client Wrapper
- [x] Testes de isolamento

### Sprint 2 ✅ (Concluído)
- [x] Sistema de autenticação JWT
- [x] Rotas de registro e login
- [x] Middleware de autenticação
- [x] Transição de segurança (x-tenant-id → JWT)
- [x] Rota de perfil de usuário
- [x] Testes de isolamento com JWT

### Sprint 3 ✅ (Concluído)
- [x] CRUD completo de Serviços
- [x] CRUD completo de Profissionais
- [x] CRUD completo de Agendamentos
- [x] Validação cross-tenant (Service/Professional ownership)
- [x] Testes automatizados de CRUD e isolamento
- [x] Refatoração para estrutura profissional (config/, errors/)

### Sprint 4 ✅ (Concluído)
- [x] Modelo `ProfessionalSchedule` (Horários de trabalho)
- [x] Engine de Disponibilidade (Cálculo de slots livres com suporte a UTC)
- [x] **Controle de Concorrência Crítico**: Implementado "Parent Locking" (bloqueio no nível do Profissional) dentro de transações para prevenir race conditions.
- [x] Validação estrita: Agendamentos só permitidos em slots calculados como livres.
- [x] Testes de Stress: Verificado que tentativas simultâneas de agendamento no mesmo slot são bloqueadas.

### Sprint 5 ✅ (Concluído)
- [x] Upload de Mídia (Local/S3)
- [x] Comprovante PIX (`PaymentProof`)
- [x] Status de Pagamento no Agendamento
- [x] CMS Básico (`TenantConfig`)

### Sprint 6 ✅ (Concluído)
- [x] Sistema de Avaliação (`Review`)
- [x] Sistema de Notificações (`Notification`)
- [x] Job de Lembretes (24h)

### Sprint 7 ✅ (Concluído)
- [x] **Recorrência** (Geração de Séries)
- [x] Tratamento de Conflitos (Skip Logic)
- [x] Cancelamento em Lote

### Sprint 8 ✅ (Concluído)
- [x] **Financeiro** (KPIs)
- [x] Dashboards (Receita, Agendamentos)
- [x] Relatório de Comissões (Calculado dinamicamente)

### Sprint 9 ✅ (Concluído)
- [x] **Pagamentos** (Workflow PIX)
- [x] Configuração de Chave PIX (Pública)
- [x] Fluxo de Aprovação/Rejeição Manual

### Sprint 10 ✅ (Concluído)
- [x] **Finalização** (Deploy Prep)
- [x] Otimização (Indexação do BD)
- [x] Auditoria Final

### Sprint 11 ✅ (Concluído)
- [x] **AI Agent Backend Integration**
- [x] Service Token Endpoint (`POST /api/auth/service-token`)
- [x] Public Endpoints para AI (`GET /api/public/services`, `GET /api/public/availability`)
- [x] Documentação de Segurança para Agentes

### Sprint 12 ✅ (Concluído)
- [x] **AI Agent (Offline Mode)**
- [x] Integração Google Gemini (`gemini-flash-latest`)
- [x] System Instruction (Persona de Atendente)
- [x] Function Calling Tools (listServices, checkAvailability, createAppointment)
- [x] CLI de Teste (`scripts/chat.ts`)

### Sprint 13 ✅ (Concluído)
- [x] **Multi-Tenancy for AI Agent**
- [x] Schema: `TenantConfig` com campos de IA (nome, personalidade, tom)
- [x] API: Endpoint de configuração (`PUT /api/config/agent`)
- [x] Agent: Fetch dinâmico de personalidade por tenant
- [x] Verificação: Teste com persona customizada ("RockBot")

### Sprint 14 ✅ (Concluído)
- [x] **Webhook Integration (HTTP)**
- [x] Endpoint `POST /whatsapp/inbound`
- [x] Simulação de mensagens HTTP
- [x] Pipeline completo: HTTP -> AI Brain -> Tools -> HTTP Response
- [x] Script de verificação `test-webhook.ts`

## API Reference


### Payments (PIX)
```http
GET /api/public/config/payment?tenantId=...
POST /api/appointments/:id/approve-payment
POST /api/appointments/:id/reject-payment
```

### Finance
```http
GET /api/finance/summary
GET /api/finance/report?start_date=...&end_date=...
```
- **Summary**: Total Revenue (Month), Appointment Count.
- **Report**: Detailed list with Commission Amount per appointment.

### Recurrence
```http
POST /api/appointments/recurring
GET /api/recurrence-rules
DELETE /api/recurrence-rules/:id
```
- **POST Body**: `{ frequency: 'WEEKLY', count: 4, ... appointmentData }`
- **Logic**: Skips busy slots automatically.

### Uploads
```http
POST /api/appointments/:id/proof/upload
```
- **Body**: `multipart/form-data` with `file` field.
- **Response**: `{ id, url, uploadedAt }`

### Tenant Config
```http
GET /api/config
PUT /api/config
```
- **Body (PUT)**: `{ publicName, themeColor, logoUrl }`

### Reviews
```http
POST /api/reviews
```
- **Body**: `{ appointmentId, rating, comment }`
- **Rule**: Appointment must be `COMPLETED`.

### Notifications
```http
GET /api/notifications
POST /api/notifications/run-job
```
- **GET**: Returns list of user notifications.
- **POST**: Triggers the 24h reminder job manually.

### Futuro 🚀
- [ ] Frontend React/Next.js
- [ ] Dashboard administrativo
- [ ] CI/CD com GitHub Actions
- [ ] Deploy em produção (AWS/Vercel)
- [ ] Documentação da API (Swagger)
- [ ] Sistema de pagamentos
- [ ] App mobile (React Native)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos abaixo:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Padrões de Código

- Use **TypeScript** para todo código novo
- Siga o padrão **ESLint** configurado
- Escreva **testes** para novas funcionalidades
- Documente **APIs** e funções complexas
- Use **Conventional Commits** para mensagens de commit

---

## 📄 Licença

Este projeto está sob a licença **ISC**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Contato

**Projeto FlowMaster**

- GitHub: [@KaioCumpian2](https://github.com/KaioCumpian2)
- Email: Fullsync.contato@gmail.com

---

## 🙏 Agradecimentos

- [Prisma](https://www.prisma.io/) - ORM incrível
- [Express](https://expressjs.com/) - Framework web minimalista
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados robusto
- [TypeScript](https://www.typescriptlang.org/) - JavaScript com tipos

---

<div align="center">
  
**Feito com ❤️ e e Foco 💡**

⭐ Se este projeto foi útil, considere dar uma estrela!

</div>
