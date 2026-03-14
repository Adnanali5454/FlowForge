# FlowForge

**AI-Native Workflow Automation Platform**

FlowForge is a next-generation workflow automation platform built to surpass legacy tools like Zapier. It combines a visual drag-and-drop canvas with a powerful execution engine, native AI capabilities, and enterprise-grade reliability — all in a modern, developer-friendly architecture.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Drizzle ORM |
| Canvas | React Flow |
| State | Zustand |
| Auth | JWT (jose) + bcrypt |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login & Register
│   ├── (canvas)/           # Visual Workflow Editor
│   ├── (dashboard)/        # Dashboard Pages
│   └── api/                # API Routes
├── components/
│   └── canvas/             # React Flow Canvas Components
├── hooks/                  # Zustand Store
├── lib/
│   ├── auth/               # JWT + RBAC
│   ├── connectors/         # Connector Plugin System
│   ├── db/                 # Drizzle Schema + Connection
│   ├── engine/             # Workflow Execution Engine
│   │   ├── executor/       # Core Executor
│   │   └── steps/          # Step Type Implementations
│   └── utils/              # Shared Utilities
├── styles/                 # Global CSS
└── types/                  # TypeScript Type System
```

## Step Types

FlowForge supports 15 step types out of the box:

- **Trigger** — Webhook, polling, schedule, manual, app-event, sub-workflow
- **Action** — Execute connector actions (API calls to integrated apps)
- **Filter** — Conditional logic with 13 operators and AND/OR logic
- **Path** — Multi-branch conditional routing (if/else if/else)
- **Delay** — Time-based delays (duration or until-time)
- **Loop** — Iterate over arrays with parallel execution support
- **Formatter** — 30+ data transformation operations (text, number, date, CSV)
- **Code** — Execute JavaScript/Python/TypeScript with sandboxed runtime
- **HTTP** — Make API requests with auth, headers, body types
- **AI** — Claude, GPT-4o, Gemini integration with structured output
- **Human-in-the-Loop** — Approval workflows with deadlines and escalation
- **Sub-Workflow** — Compose workflows within workflows
- **Digest** — Batch items and release on schedule or threshold
- **Storage** — Key-value persistence across executions
- **Error Handler** — Retry, skip, halt, or route on failure

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- npm or yarn

### Installation

```bash
git clone https://github.com/your-org/flowforge.git
cd flowforge
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your-secret-key-min-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

```bash
npx drizzle-kit push
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Database Schema

14 tables covering the full platform:

- `users`, `workspaces`, `workspace_members` — Multi-tenant user management
- `workflow_definitions`, `workflow_versions` — Workflow storage with versioning
- `workflow_executions`, `step_executions` — Execution history and step-level logs
- `connector_registry`, `app_connections` — Connector catalog and user credentials
- `workflow_folders` — Organizational hierarchy
- `workspace_variables` — Reusable variables with environment scoping
- `workflow_storage` — Key-value persistence for Storage steps
- `digest_entries` — Digest batch accumulation
- `audit_log` — Full audit trail
- `sessions` — Auth session management

## Connector System

Extensible plugin architecture. Each connector implements:

```typescript
interface ConnectorPlugin {
  manifest: ConnectorManifest;
  testConnection(credentials: Record<string, string>): Promise<boolean>;
  executeAction(actionKey: string, params: Record<string, unknown>, credentials: Record<string, string>): Promise<unknown>;
  // ... triggers, webhooks, dynamic fields
}
```

Built-in connectors: **Webhook**, **Scheduler**. Framework supports unlimited custom connectors.

## Execution Engine

The `WorkflowExecutor` processes workflows step-by-step with:

- **Data Mapping** — Template syntax `{{steps.stepId.output.field}}` with expression support
- **Error Handling** — Per-step retry with fixed/exponential backoff
- **Path Branching** — Multi-branch conditional routing
- **Loop Iteration** — Array iteration with safety caps
- **Callbacks** — Real-time step progress reporting

## Auth & RBAC

Role hierarchy: `owner` > `admin` > `editor` > `viewer`

| Permission | Owner | Admin | Editor | Viewer |
|-----------|-------|-------|--------|--------|
| Read workflows | ✓ | ✓ | ✓ | ✓ |
| Edit workflows | ✓ | ✓ | ✓ | ✗ |
| Manage members | ✓ | ✓ | ✗ | ✗ |
| Manage billing | ✓ | ✗ | ✗ | ✗ |

## Project Status

**Phase 1 — Foundation** ✅ Complete

- Full type system and database schema
- Workflow execution engine with 7 step executors
- Visual canvas editor with React Flow
- Dashboard UI (workflows, executions, connectors, settings)
- Auth system with JWT + RBAC
- API routes for all core operations
- Zero-error production build

**Phase 2 — Connectors & Integrations** (Next)

- 50 built-in connectors (Slack, Gmail, Sheets, Salesforce, etc.)
- OAuth2 flow implementation
- Connector marketplace

**Phase 3 — AI & Advanced Features**

- AI step execution with Claude/GPT-4o
- AI-powered workflow generation from natural language
- Sub-workflow execution
- HITL approval flow UI
- Template library

**Phase 4 — Enterprise**

- Admin center with team management
- Usage analytics and billing
- SSO/SAML integration
- Audit logging dashboard
- White-label support

---

Built by **Syed Ali Adnan** | [syedaliadnan.com](https://syedaliadnan.com)
