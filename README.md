# 📡 Broadcast — SaaS de envio e agendamento de mensagens

SaaS multi-tenant onde cada cliente gerencia suas próprias conexões, contatos e mensagens (envio imediato ou agendado).

**🌐 Aplicação online:** https://projeto-saas-26402.web.app

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | Material UI 5 + Tailwind CSS 3 |
| Auth | Firebase Authentication (E-mail/Senha) |
| Banco | Cloud Firestore (tempo real via `onSnapshot`) |
| Backend agendado | Cloud Functions v2 (Cloud Scheduler) |
| Hosting | Firebase Hosting |
| Roteamento | React Router v6 |
| Datas | Day.js + MUI X Date Pickers |

---

## Funcionalidades

### Autenticação
- Cadastro com validação de senha forte (mín. 8 chars, maiúscula, número, símbolo)
- Login com e-mail/senha
- Rotas protegidas — usuário não autenticado é redirecionado para `/login`

### Dashboard
- Cards de métricas em tempo real: conexões, contatos, mensagens (total / enviadas / agendadas)

### Conexões (CRUD)
- Criar, editar, listar, excluir
- Excluir conexão remove em cascata os contatos e mensagens associados (chunks de 400 ops/batch)
- Contador de contatos e mensagens por conexão

### Contatos (CRUD)
- Criar, editar, listar, excluir
- Máscara de telefone brasileira `(99) 99999-9999` aplicada em tempo real
- Atalho "Enviar mensagem" abre o compose já com o contato pré-selecionado

### Mensagens (CRUD)
- Compose com seleção múltipla de contatos (Autocomplete)
- "Selecionar todos os contatos" da conexão em 1 clique
- Envio imediato (fake — sem disparo real) ou agendado com data/hora
- Filtros por status: todas / enviadas / agendadas
- Cloud Function `processScheduledMessages` roda a cada minuto e transiciona `scheduled → sent` no horário do disparo

---

## Arquitetura

```
.
├── firebase.json            # Hosting + Functions + Firestore (com headers de segurança)
├── firestore.rules          # Regras de isolamento por userId (SaaS multi-tenant)
├── firestore.indexes.json   # Índices compostos para queries
│
├── functions/               # Cloud Functions (paradigma funcional)
│   └── src/index.ts         # processScheduledMessages (scheduler a cada 1 min)
│
└── web/                     # Frontend Vite
    └── src/
        ├── firebase.ts                # Inicialização do SDK + validação de env
        ├── contexts/AuthContext.tsx   # Provider de autenticação (sem classes)
        ├── services/                  # Camada de acesso ao Firestore
        │   ├── auth.ts
        │   ├── connections.ts         # CRUD + deleteConnectionCascade
        │   ├── contacts.ts
        │   └── messages.ts
        ├── hooks/                     # Hooks reativos com onSnapshot
        │   ├── useAuth (via contexto)
        │   ├── useConnections.ts
        │   ├── useContacts.ts
        │   ├── useMessages.ts
        │   ├── useUserStats.ts        # Agregado para Dashboard e contadores
        │   └── useSnackbar.ts
        ├── components/                # Reutilizáveis (Layout, ProtectedRoute, ...)
        └── pages/                     # Login, Register, Dashboard, Connections, Contacts, Messages
```

### Decisões técnicas

- **Paradigma funcional** — zero classes em todo o projeto (frontend e functions). Componentes funcionais + hooks.
- **Sem subcoleções no Firestore** — coleções planas (`connections`, `contacts`, `messages`) com `userId` e `connectionId` como filtros, conforme requisito.
- **Real-time** — todas as listagens via `onSnapshot`. Atualizações aparecem instantaneamente em outras abas/dispositivos do mesmo usuário.
- **Optimistic UI** — dialogs fecham antes do `await` do Firestore. Como o SDK escreve localmente antes de confirmar com o servidor, o `onSnapshot` atualiza a UI imediatamente.
- **SaaS isolado** — cada documento tem `userId`, e as Firestore Rules garantem que nenhum usuário lê/escreve dados de outro (`isOwner(resource.data.userId)`). Defense-in-depth com regra catch-all `allow read, write: if false`.
- **Validação no servidor** — Rules validam tipos, tamanhos máximos, e enum de status (`'sent' | 'scheduled'`). Cliente não pode mutar `userId` ou `connectionId` em updates.
- **Headers de segurança no Hosting** — CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options.

---

## Como rodar localmente

```bash
# 1. Clonar
git clone https://github.com/Jeeeff/projetosaas.git
cd projetosaas

# 2. Configurar variáveis de ambiente
cp web/.env.example web/.env
# Preencher web/.env com as credenciais do seu projeto Firebase

# 3. Instalar dependências
cd web && npm install
cd ../functions && npm install

# 4. Rodar frontend em dev
cd ../web && npm run dev
```

## Deploy

```bash
firebase login
firebase use <seu-projeto-id>

# Build do frontend
cd web && npm run build && cd ..

# Deploy completo
firebase deploy
```

---

## Requisitos atendidos

- [x] Login/cadastro com Firebase Auth
- [x] CRUD de conexões (nome)
- [x] CRUD de contatos (nome + telefone)
- [x] CRUD de mensagens com seleção de contatos
- [x] Envio fake (não dispara mensagens reais)
- [x] Agendamento de mensagens
- [x] Filtro por status (enviadas / agendadas)
- [x] Transição automática `scheduled → sent` via Cloud Function
- [x] SaaS — cada cliente vê apenas seus próprios dados
- [x] Material UI + Tailwind CSS
- [x] Paradigma funcional (sem OOP)
- [x] Firestore em tempo real
- [x] Vite (não CRA)
- [x] Sem subcoleções no Firestore
- [x] `functions/` e `web/` separados
