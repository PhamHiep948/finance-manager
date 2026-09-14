# 9. Architecture Decisions

Each Architecture Decision Record contains: Context, Decision, Alternatives, Consequences, Status.

Status **Accepted** = established by the schema / business documentation / Architecture Decision Records in this file. **Proposed** = a principle not yet implemented in code. Do not invent Architecture Decision Records for Gin, JSON Web Token, or S3.

## ADR-001 React.js for Web Frontend

| | |
|---|---|
| **Context** | A web user interface is needed for income/expenses, dashboard, import, and authorization. |
| **Decision** | Web Frontend = React.js single-page application calling REST. |
| **Alternatives** | Server-rendered Go templates; mobile-only. Not selected because they are outside the V1 web scope. |
| **Consequences** | The frontend team can work independently from Go; all monetary and authorization rules remain enforced by the API. |
| **Status** | Accepted |

## ADR-002 Go for Backend

| | |
|---|---|
| **Context** | The system needs application programming interfaces, role-based access control, import, and SQL access. |
| **Decision** | The Backend Application is written in Go. |
| **Alternatives** | Node, Java. The repository has no requirement for those choices. |
| **Consequences** | One backend runtime; HTTP framework **To Be Determined**. |
| **Status** | Accepted |

## ADR-003 Modular Monolith instead of Microservices

| | |
|---|---|
| **Context** | One income/expense bounded context and one PostgreSQL database. |
| **Decision** | Modular Monolith; Go Backend components live in one deployable. |
| **Alternatives** | Separate Income/Expense/Auth microservices — higher operational complexity with no current driver. |
| **Consequences** | Modules do not issue SQL directly; they share Persistence. |
| **Status** | Accepted |

## ADR-004 PostgreSQL as Primary Database

| | |
|---|---|
| **Context** | User–transaction–batch–audit relationships and aggregate views. |
| **Decision** | PostgreSQL with schema `shop_finance`. |
| **Alternatives** | Spreadsheet-only; document database — neither fits currency/foreign-key constraints well. |
| **Consequences** | Local Docker uses port 5433; production host To Be Determined. |
| **Status** | Accepted |

## ADR-005 REST/HTTPS/JSON

| | |
|---|---|
| **Context** | React needs a synchronous contract for CRUD + import. |
| **Decision** | REST JSON; HTTPS in production. |
| **Alternatives** | GraphQL, gRPC — no complex-client requirement justifies them. |
| **Consequences** | An OpenAPI specification does not exist yet (**To Be Determined**). |
| **Status** | Accepted |

## ADR-006 USD as Canonical Currency

| | |
|---|---|
| **Context** | The shop views both USD and EUR but must not maintain two ledgers. |
| **Decision** | Store USD; EUR is display conversion. Enforced by SQL CHECK. |
| **Alternatives** | Multi-currency rows; store both — risks inconsistent totals. |
| **Consequences** | Exchange-rate source To Be Determined; source reports remain USD. |
| **Status** | Accepted |

## ADR-007 Soft Delete for Financial Transactions

| | |
|---|---|
| **Context** | Income/expense history must not be lost. |
| **Decision** | Use `deleted_at` / `deleted_by`; active lists filter for NULL. |
| **Alternatives** | Hard delete — loses business audit trail. |
| **Consequences** | Partial unique indexes on users/categories use `deleted_at IS NULL`. |
| **Status** | Accepted |

## ADR-008 Backend-Enforced Authorization

| | |
|---|---|
| **Context** | Four roles; Viewer/Employee can call APIs manually. |
| **Decision** | Identity & Access is mandatory in Go; React only improves user experience. |
| **Alternatives** | Hide UI buttons only — insufficient. |
| **Consequences** | Every write scenario in Section 6 contains a 403 path. Session mechanism To Be Determined. |
| **Status** | Accepted (principle). Session implementation: Proposed / To Be Determined |

## Decisions intentionally not yet captured as ADRs

Attachment storage, local Transport Layer Security, CI, monitoring, Excel parser, password-hashing algorithm — see [Section 11](11-risks-and-technical-debt.md).
