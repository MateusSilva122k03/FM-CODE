# 🤖 Guia de Integração do AI Agent (Frontend)

Este documento explica como o Frontend deve interagir com o Backend para permitir que os clientes configurem seus próprios Bots de Inteligência Artificial, e como testar essas configurações.

## 🧠 Visão Geral

O FlowMaster agora possui um **AI Agent Multi-Tenant**. Isso significa que cada Barbearia (Tenant) tem seu próprio assistente virtual com personalidade única.

O fluxo é:
1.  O Dono da Barbearia configura o bot no Dashboard (Frontend).
2.  O Frontend salva essa configuração no Backend via API.
3.  Quando uma mensagem chega no WhatsApp, o Agente busca essa configuração e responde com a personalidade correta.

---

## 🛠️ 1. Configurar o Bot (Dashboard do Cliente)

Crie uma tela de "Configurações do Assistente Virtual" no Dashboard administrativo.

### Endpoint API

**PUT** `/api/config/agent`

**Auth**: Bearer Token (JWT do usuário logado)

### Payload (Body)

```json
{
  "agentName": "Janaína da Recepção",
  "agentGreeting": "Oiii tudo bem? Aqui é a Jana! 💖",
  "agentPersonality": "Você é a Janaína, recepcionista da Barbearia. Você é muito simpática, usa muitos emojis e chama os clientes de 'anjo' ou 'querido'.",
  "agentTone": "casual" 
}
```

*   `agentTone`: Pode ser "friendly", "formal" ou "casual".
*   `agentPersonality`: Instrução completa do sistema (Prompt). Se enviado, sobrescreve o tom padrão.

### Exemplo de Uso (Frontend)

```javascript
/* Exemplo de função no React/Next.js */
async function saveBotConfig(data) {
  const response = await fetch('http://localhost:3000/api/config/agent', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

---

## 🧪 2. Testar o Bot (Simulação)

Como não podemos usar o WhatsApp real em desenvolvimento local (sem túnel), simulamos uma mensagem chegando via HTTP.

### Endpoint do Agente (Simulador)

**POST** `http://localhost:4000/whatsapp/inbound`

> **Nota**: O Agente roda na porta **4000**, separada do Backend principal (3000).

### Payload de Teste

```json
{
  "message": "Quais serviços vocês tem?",
  "tenantId": "ID-DA-BARBEARIA-AQUI", 
  "senderId": "teste-frontend"
}
```

*   `tenantId`: **MUITO IMPORTANTE**. Você precisa enviar o ID da barbearia que você configurou no passo 1. Se enviar errado, ele vai responder como o bot padrão.

### Exemplo de Teste (Curl)

Você pode criar um botão "Testar Bot" no Frontend que faz essa chamada para validar a resposta.

```bash
curl -X POST http://localhost:4000/whatsapp/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá, quem é você?",
    "tenantId": "seu-tenant-id",
    "senderId": "tester"
  }'
```

---

## 🚀 Roteiro de Teste Completo (User Story)

Para garantir que tudo funciona:

1.  **Login**: Entre no sistema com um usuário de uma barbearia (ex: `admin@barber.com`).
2.  **Config**: Vá na tela de configuração e defina:
    *   Nome: "Robô Bravo"
    *   Personalidade: "Você é um robô muito bravo e impaciente."
3.  **Salvar**: Envie o PUT para `/api/config/agent`.
4.  **Testar**: Envie uma POST para o simulador (`localhost:4000/whatsapp/inbound`) usando o tenantId desse usuário.
5.  **Verificar**: Se a resposta for "O QUE VOCÊ QUER? TÔ OCUPADO!", parabéns! A integração funcionou.

---

## 📋 Campos Disponíveis para Edição

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `agentName` | String | O nome que o robô usa para se apresentar. |
| `agentGreeting` | String | A primeira frase de boas vindas (ainda não implementado no fluxo ativo, mas salvo no banco). |
| `agentPersonality`| String | (Avançado) O prompt completo do sistema. É aqui que a mágica acontece. |
| `agentTone` | String | Preset simples: 'friendly', 'formal', 'casual'. Usado se personality for vazio. |
