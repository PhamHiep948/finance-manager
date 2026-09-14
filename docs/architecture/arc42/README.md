# HandmadeFinance — Architecture Documentation (arc42)

This is **ESSENTIAL-level arc42** documentation. It can be read independently; a separate C4 architecture-model document set is not required.

Sources: business documentation under `docs/`, `database/`, `docker-compose.yml`, `.env.example`, and the React → Go → PostgreSQL architecture baseline.

## Architecture baseline

```text
Users
  → React.js Web Frontend
  → HTTPS / REST / JSON
  → Go Backend (Modular Monolith)
  → Persistence / Data Access
  → PostgreSQL
```

The Frontend **does not** access PostgreSQL. Real authorization is enforced by the Go Backend; hiding React buttons is only a user-experience measure.

Context / building-block diagrams are included **inside** Sections 3 and 5 (Mermaid + images under `diagrams/`).

## Table of contents

| # | Section | File |
| - | ------- | ---- |
| 1 | Introduction and Goals | [01-introduction-and-goals.md](01-introduction-and-goals.md) |
| 2 | Architecture Constraints | [02-architecture-constraints.md](02-architecture-constraints.md) |
| 3 | Context and Scope | [03-context-and-scope.md](03-context-and-scope.md) |
| 4 | Solution Strategy | [04-solution-strategy.md](04-solution-strategy.md) |
| 5 | Building Block View | [05-building-block-view.md](05-building-block-view.md) |
| 6 | Runtime View | [06-runtime-view.md](06-runtime-view.md) |
| 7 | Deployment View | [07-deployment-view.md](07-deployment-view.md) |
| 8 | Cross-cutting Concepts | [08-crosscutting-concepts.md](08-crosscutting-concepts.md) |
| 9 | Architecture Decisions | [09-architecture-decisions.md](09-architecture-decisions.md) |
| 10 | Quality Requirements | [10-quality-requirements.md](10-quality-requirements.md) |
| 11 | Risks and Technical Debt | [11-risks-and-technical-debt.md](11-risks-and-technical-debt.md) |
| 12 | Glossary | [12-glossary.md](12-glossary.md) |

## Information-source labels

| Label | Meaning |
| ----- | ------- |
| FACT | Schema, docs 01–06, DATABASE.md, docker-compose |
| DECISION | Architecture baseline in this documentation + Architecture Decision Records in Section 9 |
| PROPOSED | Quality target not yet measured in production |
| To Be Determined | Not decided yet; do not invent technology |

## Domain (V1)

Income and expense management for a handmade shop: Income, Expense, Dashboard, Reports, Excel Import, Attachments, Audit Log, User Management, Profile, Authentication, Authorization.

This is not an enterprise resource planning system, stock-keeping-unit inventory system, customer relationship management system, double-entry accounting system, payment gateway, Etsy API integration, or artificial-intelligence system.
