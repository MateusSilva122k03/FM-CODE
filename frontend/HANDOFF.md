# Guia de Integração Frontend - FlowMaster 💈

Este documento serve como referência técnica para o time de Frontend consumir a API do FlowMaster.

## 📡 Base URL & Ambientes

| Ambiente | URL | Descrição |
|---|---|---|
| **Desenvolvimento** | `http://localhost:3000` | Backend rodando localmente |
| **Staging** | `https://API-URL-DO-RENDER.com` | Backend na nuvem (Futuro) |

## 🔐 Autenticação (Fluxo JWT)

O sistema usa JWT. O Frontend deve armazenar o token (ex: localStorage ou Cookie seguro) e enviá-lo em todas as requisições protegidas.

### 1. Login (Obtendo o Token)
`POST /auth/login`
**Payload:**
```json
{ "email": "admin@barber.com", "password": "123" }
```
**Resposta:**
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": "...", "name": "Admin", "role": "ADMIN", "tenantId": "..." }
}
```

### 2. Requisições Protegidas
Adicione o header `Authorization` em **todas** as chamadas `/api/*`:
```http
Authorization: Bearer <SEU_TOKEN_AQUI>
```

> **Nota**: O `tenantId` já está embutido no token. Não é necessário enviá-lo nos headers ou query params (exceto em rotas públicas).

---

## 🛒 Fluxos Principais (Workflows)

### A. Fluxo de Agendamento (Visão Cliente)

1.  **Listar Serviços**: `GET /api/services`
2.  **Listar Profissionais**: `GET /api/professionals`
3.  **Checar Disponibilidade**: `GET /api/availability?professionalId=...&date=2024-12-06`
    *   *Retorna slots livres (ex: ["09:00", "10:30"])*
4.  **Criar Agendamento**: `POST /api/appointments`
    *   *Body*: `{ serviceId, professionalId, startTime: "2024-12-06T09:00:00Z" }`
    *   *Status Inicial*: `SCHEDULED` (ou `PENDING_PROOF_UPLOAD` se config exigir PIX).

### B. Fluxo de Pagamento PIX

1.  **Exibir Chave PIX**: 
    *   Rota Pública: `GET /api/public/config/payment?tenantId=<ID_DA_BARBEARIA>`
    *   *Mostre o QR Code ou Chave Copia-e-Cola.*
2.  **Upload de Comprovante**: `POST /api/appointments/:id/proof/upload` (Multipart/Form-Data).
3.  **Status**: Agendamento vira `PENDING_APPROVAL`.

### C. Dashboard Financeiro (Visão Admin)

1.  **Resumo do Mês**: `GET /api/finance/summary`
    *   *Mostre Cards: Receita Total, Total Agendamentos.*
2.  **Lista Detalhada**: `GET /api/finance/report?start_date=...&end_date=...`
    *   *Tabela com colunas: Data, Cliente, Serviço, Valor, Comissão (Auto-Calculada).*

---

## 📄 Tipagem (TypeScript Interfaces)

Use estas interfaces como base para seus componentes React:

```typescript
// Agendamento
interface Appointment {
  id: string;
  date: string; // ISO Date
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING_PROOF_UPLOAD' | 'PENDING_APPROVAL' | 'PAID' | 'REJECTED';
  service: Service;
  professional: Professional;
  user?: User; // Cliente
}

// Serviço
interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutos
}

// Profissional
interface Professional {
  id: string;
  name: string;
  commissionRate: number; // ex: 15.0
}
```

## 🚨 Tratamento de Erros

A API retorna erros no seguinte formato padrão. Implemente um `Toaster` ou `Alert` para exibir `message`.

**Erro 400/500:**
```json
{
  "status": "error",
  "message": "Horário já reservado por outro cliente."
}
```

---

Qualquer dúvida, consulte o `README.md` completo no diretório raiz! 🚀
