# ADR: MO Technology Stack

**Status**: Accepted
**Date**: 2026-02-09
**Scope**: All technology choices for MO (Multi-Agent Wellness Orchestrator)

---

## Decision Summary

| Domain              | Decision                          | Alternatives Rejected |
|---------------------|-----------------------------------|-----------------------|
| Agent Orchestration | Custom TypeScript pipeline (~200 lines) | LangGraph, CrewAI |
| LLM Provider        | Anthropic Claude                  | OpenAI, Google        |
| LLM Models          | Sonnet 4.5 (pipeline agents), Haiku 4.5 (PHYSICIAN) | —      |
| Backend             | Fastify (TypeScript)              | FastAPI (Python)      |
| Database            | PostgreSQL + Drizzle ORM          | Prisma, TypeORM       |
| DB Driver           | postgres.js (postgres)            | pg                    |
| Monorepo            | Turborepo + pnpm workspaces       | Nx, Lerna             |
| Validation          | Zod (single schema source of truth) | io-ts, Yup          |
| Frontend            | React Router v7 + Vite (later, not MVP) | Next.js, SvelteKit |
| Mobile              | React Native + Expo (later)       | Flutter               |
| Notifications       | Firebase Cloud Messaging (later)  | —                     |
| Cache               | Redis (later, not MVP)            | —                     |
| Cloud               | AWS (ECS Fargate, RDS, ElastiCache) (later) | GCP, Azure          |
| CI/CD               | GitHub Actions                    | —                     |
| Testing             | Vitest                            | Jest                  |
| LLM Observability   | Pino structured logging + PostgreSQL metrics | LangSmith, LangFuse |

---

## 1. Agent Orchestration: Custom TypeScript Pipeline

**Decision**: Custom TypeScript pipeline implementation (~200 lines).

**Alternatives Rejected**: LangGraph, CrewAI.

**Rationale**:

MO's pipeline is strictly sequential and deterministic: INTAKE -> SCIENTIST -> NUTRITIONIST -> DIETITIAN -> CHEF -> COACH -> OUTPUT, with PHYSICIAN as a conditional on-demand interrupt. This pattern is simple enough to implement directly without framework overhead.

**Why not LangGraph**:

- LangGraph JS is significantly less mature than its Python counterpart. Documentation is sparse, the API surface is incomplete, and community adoption is limited.
- MO does not need LangGraph's core capabilities: complex routing, parallel execution branches, dynamic graph construction, or sophisticated state management. The pipeline is a fixed sequence with well-defined handoffs.
- A custom pipeline gives full control over execution flow, error handling, state serialization, and observability without black-box framework behavior.

**Why not CrewAI**:

- CrewAI is Python-only. Adopting it would force the entire backend to Python, conflicting with the full-stack TypeScript decision.
- CrewAI's role-based delegation model is designed for autonomous agents that decide their own task ordering. MO agents have fixed positions and do not require autonomy.

**Custom Pipeline Architecture**:

The pipeline is implemented as a simple TypeScript function that:

1. Accepts initial state (intake questionnaire data)
2. Calls each agent sequentially via Claude SDK
3. Passes structured JSON payloads between agents
4. Checks for red flags after each agent (conditional PHYSICIAN invocation)
5. Returns final aggregated output

Agent calls use Claude's tool calling feature. The pipeline registers deterministic TypeScript functions as tools (BMR calculation, TDEE estimation, macro distribution logic, meal slot validation). The LLM reasons about which tools to call and interprets results, but critical numeric calculations are pure TypeScript functions, ensuring reproducible results without LLM hallucination.

---

## 2. LLM Provider: Anthropic (Claude)

**Decision**: Claude Sonnet 4.5 as the default model for all pipeline agents. Claude Haiku 4.5 for PHYSICIAN Q&A.

**Rationale**:

MO agents carry long system prompts. COACH alone is ~400 lines / ~12k characters. SCIENTIST, NUTRITIONIST, and DIETITIAN each have multi-page specifications with precise numeric constraints, banned terminology lists, and citation requirements. This demands strong instruction following at high context lengths.

- Claude's 200k context window accommodates all agent prompts plus accumulated pipeline state without truncation.
- Sonnet 4.5 balances output quality and cost for the five main pipeline agents where nuanced reasoning matters (macro calculations, meal architecture, recipe generation, training programming).
- Haiku 4.5 handles PHYSICIAN's structured Q&A pattern well at lower cost. PHYSICIAN responses follow a rigid template (evidence citation, mechanism explanation, referral recommendation, disclaimer footer) that does not require the full capability of Sonnet.

---

## 3. Backend: Fastify (TypeScript)

**Decision**: Fastify as the HTTP framework, TypeScript as the language, full-stack TypeScript monorepo.

**Alternatives Rejected**: FastAPI (Python).

**Rationale**:

**Developer expertise**: The developer is a TypeScript developer with production experience managing a TypeScript monorepo (Klox project). Leveraging existing expertise accelerates development and reduces risk.

**Full-stack TypeScript advantages**:

- **Code sharing**: Types, Zod schemas, constants, validation logic, utility functions are shared between backend, agent pipeline, and future frontend (React Router) and mobile (React Native) without duplication or drift.
- **Monorepo structure**: Turborepo + pnpm workspaces enable clean separation of concerns across packages (`@mo/agents`, `@mo/api`, `@mo/db`, `@mo/types`, `@mo/web`, `@mo/mobile`) while maintaining shared code and atomic versioning.
- **Single language expertise**: No context switching between Python (backend) and TypeScript (frontend/mobile). The entire stack uses the same language, tooling, and ecosystem.

**Fastify specifically**:

- Fastest Node.js HTTP framework. Benchmarks show 2-3x throughput vs Express.
- Async-native. Handles LLM streaming responses and pipeline orchestration without blocking.
- Strong TypeScript support with first-class type inference for routes, schemas, and plugins.
- Plugin ecosystem sufficient for MO's needs (authentication, CORS, rate limiting, logging).

**Why not FastAPI (Python)**:

- Would require splitting the stack: Python for backend, TypeScript for frontend/mobile.
- No code sharing between backend and frontend (types must be manually synchronized or code-generated).
- Developer lacks production Python experience. FastAPI is excellent, but unfamiliarity introduces risk.
- LangGraph (which motivated the Python stack) is no longer being used. Without LangGraph, the main argument for Python disappears.

---

## 4. Database: PostgreSQL + Drizzle ORM

**Decision**: PostgreSQL with Drizzle ORM, postgres.js as the driver.

**Alternatives Rejected**: Prisma, TypeORM.

**Rationale**:

**PostgreSQL**: Relational model fits MO's entity relationships: users, intake questionnaires, programs, weekly plans, individual meals, recipes, progress snapshots, training logs. Strong JSONB support for storing agent payloads without a rigid schema migration on every payload change.

**Drizzle ORM**:

- **Type-safe queries**: Full TypeScript type inference from schema to query results. No runtime type mismatches.
- **Lightweight**: Thin abstraction over SQL. Generates efficient queries without magic or hidden N+1 problems.
- **PostgreSQL-first**: Excellent PostgreSQL support including JSONB, array types, and advanced features.
- **Developer familiarity**: Same stack as the developer's Klox project. Proven in production.

**Why not Prisma**:

- Heavier runtime. Prisma Client is a query engine with significant overhead.
- Schema language (Prisma Schema Language) is a custom DSL, not TypeScript. Drizzle schemas are TypeScript, enabling programmatic schema generation and better IDE integration.

**Why not TypeORM**:

- Active Record pattern encourages models with business logic, leading to anemic domain models. Drizzle's data mapper pattern separates concerns cleanly.
- TypeORM has a history of breaking changes and inconsistent type inference.

**postgres.js driver**:

- Fastest PostgreSQL driver for Node.js.
- Native TypeScript support.
- Better error messages and connection pooling than pg.

---

## 5. Monorepo: Turborepo + pnpm

**Decision**: Turborepo for task orchestration, pnpm workspaces for package management.

**Alternatives Rejected**: Nx, Lerna.

**Rationale**:

- **Developer expertise**: Same stack as Klox project. Proven for monorepo management.
- **Simplicity**: Turborepo focuses on task caching and parallelization without heavy abstractions. Configuration is straightforward.
- **pnpm**: Faster installs, strict node_modules structure prevents phantom dependencies, efficient disk usage with content-addressable storage.

**Why not Nx**:

- Heavier and more opinionated. MO's monorepo structure is simple (API, agents, web, mobile, shared packages) and does not require Nx's advanced code generation, migration, and plugin ecosystem.

**Why not Lerna**:

- Lerna's original use case (independent package versioning for open-source libraries) does not apply. MO packages are versioned atomically as a single application.

---

## 6. Validation: Zod (Single Schema Source of Truth)

**Decision**: Zod as the single source of truth for all schemas across the stack.

**Alternatives Rejected**: io-ts, Yup.

**Rationale**:

- **Schema = Type**: Zod schemas are the single source of truth for both runtime validation and TypeScript types. No duplication.
- **DX**: Excellent error messages and composability. Schemas are easy to read and write.
- **Ecosystem integration**: First-class integration with Fastify, React Hook Form, and other tools in the TypeScript ecosystem.
- **Agent payloads**: Agent-to-agent JSON payloads are validated with Zod schemas. This ensures type safety across the pipeline and catches schema mismatches at runtime.

**Zod derives everything**:

```
Zod Schema (source of truth)
  ├── TypeScript types (z.infer<>)
  ├── Runtime validation (.parse / .safeParse)
  ├── Anthropic tool input_schema (via zod-to-json-schema)
  └── OpenAPI spec (via @fastify/swagger, optional)
```

- `zod-to-json-schema`: Converts Zod schemas to JSON Schema objects for Anthropic's `input_schema` field in tool definitions. Eliminates the need to maintain parallel hand-written JSON Schemas alongside Zod schemas.
- `@fastify/swagger` + `@fastify/swagger-ui` (optional): Fastify can derive OpenAPI specs from route schemas. Since Zod schemas already define request/response shapes, this auto-generates API docs at `/docs` with minimal configuration. Nice for personal reference but not essential.

---

## 7. Deterministic Tools Pattern

**Decision**: SCIENTIST calculations (BMR, TDEE, macros, timelines) are implemented as pure TypeScript functions registered as Claude tools.

**Rationale**:

MO's numeric calculations must be deterministic and reproducible. BMR, TDEE, macro targets, and timelines follow established formulas (Mifflin-St Jeor, activity multipliers, 1.6-2.2g protein/kg LBM, etc.). These calculations do not require LLM reasoning.

**Implementation**:

- Each calculation (e.g., `calculateBMR`, `calculateTDEE`, `distributeMacros`) is a pure TypeScript function with Zod-validated input/output schemas.
- These functions are registered as Claude tools when invoking the SCIENTIST agent.
- The SCIENTIST agent's prompt instructs it to call these tools with appropriate parameters based on user intake data.
- The LLM reasons about which tools to call and interprets results, but the math itself is deterministic TypeScript code.

**Advantages**:

- **Reproducibility**: Given the same inputs, calculations always produce identical outputs.
- **Testing**: Pure functions are trivial to unit test without mocking LLM calls.
- **Transparency**: Calculation logic is inspectable TypeScript code, not black-box LLM generations.
- **Cost efficiency**: Numeric calculations do not consume LLM tokens. Only reasoning about which calculations to perform and how to interpret results uses the LLM.

---

## 8. Frontend: React Router v7 + Vite (Later, Not MVP)

**Decision**: React Router v7 with Vite as the bundler. Located at `apps/web/`.

**Rationale**:

MO's frontend is a personal dashboard: progress tracking, plan viewing, meal display, training logs. All content is behind authentication — there are no public-facing pages, no SEO concerns, no need for server-side rendering.

- **React Router v7**: File-based routing, data loaders, and form actions. Covers MO's routing needs without framework overhead.
- **Vite**: Fast HMR, simple configuration, ESM-native. No Webpack complexity.
- **Data flow**: React Router loaders → `fetch("/api/...")` → Fastify backend. Clean separation between frontend and API.
- **Code sharing**: `@mo/shared` (Zod schemas, types, constants) imported directly into the web app.

**Why not Next.js**:

- SSR and Server Components add complexity with no benefit for an auth-gated personal dashboard. Every page requires authentication first, so there is no meaningful first-paint advantage from SSR.
- Vite HMR is faster than Next.js dev server.
- Simpler mental model: React Router is a router, not a full-stack framework. No blurred boundaries between server and client code.
- No Vercel dependency or deployment coupling.
- MO is a personal project. Hiring pool size and enterprise ecosystem breadth are irrelevant.

**Timeline**: Frontend development deferred until post-MVP. Initial focus is on backend API and agent pipeline.

---

## 9. Mobile: React Native + Expo (Later)

**Decision**: React Native with Expo for mobile applications.

**Rationale**:

- **Code sharing with web**: Shared TypeScript types, Zod schemas, API client code, validation logic, and utility functions via `@mo/shared`. A single TypeScript monorepo serves web, mobile, and backend.
- **Expo**: Simplifies build, deploy, and OTA updates without dedicated mobile infrastructure expertise.

**Why not Flutter**:

- Flutter would require maintaining two separate codebases in two different languages (Dart for mobile, TypeScript for web/backend). The React Native + React Router combination keeps everything in one language and one monorepo.

**Timeline**: Mobile development deferred until post-MVP.

---

## 10. Notifications: Firebase Cloud Messaging (Later)

**Decision**: Firebase Cloud Messaging for push notifications.

**Rationale**:

Standard choice for cross-platform push notifications. Works with both React Native (via `@react-native-firebase/messaging`) and web (via Firebase JS SDK). Covers the primary notification use cases:

- Weekly check-in reminders
- New plan available after pipeline run
- PHYSICIAN red flag alerts requiring user attention
- Training session reminders

**Timeline**: Notifications deferred until post-MVP. Not required for initial testing.

---

## 11. Infrastructure

**Decision**:

| Component         | Choice                   |
|-------------------|--------------------------|
| Cloud             | AWS                      |
| Compute           | ECS Fargate (containers) |
| Database          | RDS (PostgreSQL)         |
| Cache             | ElastiCache (Redis)      |
| CI/CD             | GitHub Actions           |
| Testing           | Vitest                   |
| LLM Observability | Pino + PostgreSQL (Phase A), Grafana Cloud + OpenTelemetry (Phase B) |

**Rationale**:

- **ECS Fargate**: Serverless containers. No cluster management overhead. Scales to zero when unused (relevant for early stage with few users).
- **RDS**: Managed PostgreSQL with automated backups, failover, and maintenance.
- **ElastiCache**: Managed Redis. Removes operational burden of self-hosting Redis. Used for pipeline state caching during runs (agent outputs cached for 24h to allow re-execution from any pipeline stage without re-running upstream agents). Also handles session management and rate limiting.
- **GitHub Actions**: CI/CD integrated with the repository. Standard for small teams.
- **Vitest**: Modern, fast test runner with first-class TypeScript and ESM support. Better DX than Jest (faster, better error messages, native ESM).

**LLM Observability**:

Phase A — Immediate (structured logging + token tracking):

- Pino structured logging (already bundled with Fastify). JSON logs to stdout.
- Token exposure: `llm_tokens_input`, `llm_tokens_output`, `duration_ms` returned in `AgentEnvelope`. SCIENTIST already computes these internally — surface them in the response payload.
- Persist to `agent_outputs` table (`duration_ms` and `llm_tokens_used` columns already exist in the schema).
- Cost analysis via direct PostgreSQL queries: `SELECT agent_name, SUM(llm_tokens_used) FROM agent_outputs GROUP BY agent_name`.

Phase B — When needed (Grafana Cloud free tier):

- OpenTelemetry instrumentation: `@opentelemetry/api` + `@opentelemetry/sdk-node`.
- Wrap each agent call in an OTel span (`agent:{name}`) with token/duration attributes.
- Export to Grafana Cloud via OTLP (free tier: 50GB logs, 10k metrics, 50GB traces).
- Dashboards: cost per run, latency per agent, error rates.

Phase B triggers: when the pipeline runs regularly enough that trend visualization provides value, or when debugging becomes harder than adding OTel spans.

**Redis (Later, Not MVP)**:

Redis is not required for the MVP. Initial implementation will run the pipeline synchronously without caching. Redis will be added later for:

- Caching agent outputs during pipeline runs
- Rate limiting
- Session management

**Timeline**: Initial deployment will use a simple VPS or PaaS (Railway, Render) for rapid iteration. AWS infrastructure will be provisioned when approaching production scale.

---

## 12. Cost Estimation

### LLM Costs Per Pipeline Run

A full initial plan generation invokes 5-6 agents sequentially. Each agent call:

| Parameter    | Estimate        |
|--------------|-----------------|
| Input tokens | ~2,000 (system prompt + pipeline state) |
| Output tokens| ~1,000 (structured JSON payload)        |

At Sonnet 4.5 pricing, a full pipeline run costs approximately **$0.05-0.15**.

### Monthly LLM Cost Per Active User

| Usage Pattern                              | Estimated Cost     |
|--------------------------------------------|--------------------|
| Initial full pipeline run                  | $0.05-0.15         |
| Weekly check-in (partial re-run, 4/month)  | $0.10-0.30         |
| Ad-hoc PHYSICIAN queries (Haiku, ~2/month) | $0.01-0.02         |
| **Total per active user per month**        | **$0.25-0.75**     |

### Infrastructure Costs

| Scale              | Estimated Monthly Cost |
|--------------------|------------------------|
| Base (1-10 users)  | $50-100                |
| 100 active users   | $200-300               |
| 1,000 active users | $500-800               |

Base cost dominated by RDS and compute minimum. LLM costs dominate at scale.

---

## 13. Summary

The final stack is:

- **Full-stack TypeScript**: Shared code across backend, frontend, mobile
- **Fastify**: Fast, async-native HTTP framework
- **PostgreSQL + Drizzle**: Type-safe relational database with lightweight ORM
- **Custom agent pipeline**: ~200 lines of TypeScript, no framework overhead
- **Claude Sonnet 4.5**: Main pipeline agents
- **Claude Haiku 4.5**: PHYSICIAN agent
- **Deterministic tools**: SCIENTIST calculations as pure TypeScript functions
- **Turborepo + pnpm**: Monorepo task orchestration and package management
- **Zod**: Single schema source of truth (types, validation, Anthropic tool schemas, OpenAPI)
- **Vitest**: Fast, modern testing
- **React Router v7 + Vite (later)**: Lightweight SPA frontend for auth-gated dashboard
- **React Native + Expo (later)**: Mobile with shared `@mo/shared` package
- **Pino + PostgreSQL**: LLM observability (Phase A), Grafana Cloud + OTel (Phase B)

This stack leverages the developer's existing TypeScript expertise, enables maximum code sharing across all application layers, and provides full control over the agent pipeline without framework lock-in. Simplicity and DX are prioritized over scalability — MO is a personal project, not a commercial product.
