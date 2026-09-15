# Detailed UML — HandmadeFinance

> **Status:** Code-level design for ASP.NET Core/C#; the backend has not been implemented.

This UML set expands the C3/C4 architecture using the intended class names and target folder structure:

| Document | Content |
|---|---|
| [Class diagrams](01-class-diagrams.md) | Controllers, DTOs, Services, Policies, Validators, Entities, and Repositories for Authentication, Income, and Expense |
| [Sequence diagrams](02-sequence-diagrams.md) | Login, income creation/update, and expense creation/soft deletion, including error paths |
| [Folder structure](../../07-folder-structure.md) | Target React and three-tier ASP.NET Core structure |

## Relationship to C4 and arc42

- C4 Level 3 describes architectural components and their major responsibilities.
- C4 Level 4 describes code-level dependency patterns.
- UML documents classes, methods, and call order for Authentication, Income, and Expense.
- The arc42 Runtime View provides broader system-wide runtime scenarios.

Endpoints in the sequence diagrams are a provisional contract. The Step 4 OpenAPI 3.0 specification has **NOT BEEN IMPLEMENTED** and will become the source of truth for HTTP paths, requests, responses, and the security scheme.
