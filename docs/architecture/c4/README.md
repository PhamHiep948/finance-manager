# C4 Model — HandmadeFinance

> **Status:** Architecture baseline · **Audience:** developers, reviewers, and maintainers

The documentation proceeds from the outside in. Every node has a **name**, **type** (`Person`, `Software System`, `Container`, `Component`), technology where relevant, and a short description.

```mermaid
flowchart LR
    C1["C1 · System Context<br/><small>Who uses the system?</small>"]
    C2["C2 · Container<br/><small>What runtime units make up the system?</small>"]
    C3["C3 · Component<br/><small>How is the .NET Backend decomposed?</small>"]
    C4["C4 · Code<br/><small>How are the two core features organized?</small>"]
    C1 -->|"zoom into HandmadeFinance"| C2
    C2 -->|"zoom into .NET Backend"| C3
    C3 -->|"zoom into Income & Expense"| C4
    style C1 fill:#1168bd,color:#fff,stroke:#0b4884
    style C2 fill:#1168bd,color:#fff,stroke:#0b4884
    style C3 fill:#1168bd,color:#fff,stroke:#0b4884
    style C4 fill:#1168bd,color:#fff,stroke:#0b4884
```

| Level | Document | Scope |
|---|---|---|
| C1 | [System Context](01-system-context.md) | Four roles and the HandmadeFinance boundary |
| C2 | [Container](02-container.md) | React Web, .NET Backend, PostgreSQL, local file storage |
| C3 | [Component](03-component.md) | Components inside the .NET Backend |
| C4 | [Code — two core features](04-code.md) | C# classes/interfaces for Income and Expense management |

## Implementation Status

| Unit | Actual status |
|---|---|
| React Web | Mock UI exists in `src/frontend/` |
| Mock store/auth | Runs in the browser using JavaScript data and Web Storage |
| .NET Backend | Target architecture; not implemented |
| PostgreSQL | Schema designed; not connected to the application |
| Local file storage | Target adapter and location designed; not implemented |

The diagrams describe the **target architecture** and state the current implementation status so that design is not mistaken for working source code. Level 4 is a code-level target because the .NET Backend has not been implemented.

## Color Conventions

- Dark blue: the primary unit being described.
- Light blue: a neighboring element in the same system.
- Gray: a user or element outside the boundary being zoomed.
- Dashed line: a Software System or Container boundary.

See also: [Use Case Diagram](../../03-use-cases.md#use-case-diagram) · [arc42](../arc42/README.md).
