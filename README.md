# HandmadeFinance

Income and expense management web app for a handmade shop: record money in, money out, track total revenue, total expenses, and net profit over time and by category. Amounts are stored in USD; the interface can convert them to EUR for display.

The target stack is a **React.js** frontend (**HandmadeFinance**), a **Go** backend, and **PostgreSQL** for data storage. The mock version in this repository still runs entirely in the browser (API integration is not implemented yet).

![Dashboard](docs/images/admin/01-dashboard.png)

## Main features

- Login, logout, and role-based access control in the UI
- Dashboard: total revenue, total expenses, net profit, transaction count, charts, revenue by income category, and recent transactions
- Income management: full-column list (show/hide columns), add/edit modal, detail modal; product name, order code, EU region, sales channel, quantity, unit price, Item / Discount / Subtotal / Shipping / Tax, pre-tax amount / tax rate / post-tax amount, and record status
- Expense management: same workflow; payee, domestic/international scope, payment method, tax rate, and post-tax amount
- Reports & analytics: overview, by day, by month, by income category, by expense category, report export (print)
- Excel data import: file selection, preview, and import history in the UI
- Activity log
- User management (Admin): add/edit, enable/disable, avatar
- Profile: account (phone number, avatar), security, roles & permissions

## Roles

There are four roles. Menus and buttons are shown only when the user has permission.

| | Admin | Shop Owner | Employee | Viewer |
|---|---|---|---|---|
| Dashboard | Yes | Yes | Yes | Yes |
| View income / expenses | Yes | Yes | Yes | Yes |
| Add income / expenses | Yes | Yes | Yes | |
| Edit income / expenses | Yes | Yes | Own records | |
| Soft-delete income / expenses | Yes | Yes | | |
| Import Excel data | Yes | Yes | Yes | |
| Reports | Yes | Yes | | Yes |
| Activity log | Yes | Yes | | |
| Users | Yes | | | |
| Personal profile | Yes | Yes | Yes | Yes |

Demo accounts (password `123456`):

- `admin@demo.local` — Administrator
- `owner@demo.local` — Shop Owner
- `staff@demo.local` — Employee
- `viewer@demo.local` — Viewer

![Login](docs/images/chung/01-dang-nhap.png)

## Mind map

![HandmadeFinance mind map](docs/mindmap.png)

## Workflow

Several separate flows share the same convention: pill shape = start/end, rectangle = step, diamond = Yes / No. A button is hidden when permission is missing; unauthorized URL access → `#/403`.

### 1. Login

```mermaid
flowchart TD
  S([Start]) --> A[Open HandmadeFinance]
  A --> B[Enter email and password]
  B --> C{Credentials valid and account active?}
  C -->|No| D[Show form error]
  D --> B
  C -->|Yes| E[Store session]
  E --> F[Open Dashboard]
  F --> END([End])

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  classDef stepLite fill:#93C5FD,stroke:#2563EB,color:#1E3A8A
  classDef decision fill:#EFF6FF,stroke:#2563EB,color:#1D4ED8
  class S,END startEnd
  class A,B,E,F step
  class D stepLite
  class C decision
```

### 2. Record income or expense

Admin, Shop Owner, Employee. Viewer does not have an add button.

```mermaid
flowchart TD
  S([Start]) --> A[Open income or expenses from Dashboard]
  A --> B{Has create permission?}
  B -->|No| C[403 or hide button]
  C --> END1([End])
  B -->|Yes| D[Open entry modal]
  D --> E{All required fields provided?}
  E -->|No| D
  E -->|Yes| F[Save in USD · source MANUAL]
  F --> G{Attachment provided?}
  G -->|Yes| H[Save name / type / size]
  G -->|No| I[Write audit log]
  H --> I
  I --> J[Show in list]
  J --> END2([End])

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  classDef stepLite fill:#93C5FD,stroke:#2563EB,color:#1E3A8A
  classDef decision fill:#EFF6FF,stroke:#2563EB,color:#1D4ED8
  class S,END1,END2 startEnd
  class A,D,F,I,J step
  class C,H stepLite
  class B,E,G decision
```

### 3. Edit or soft delete

Employees may edit only records they created. Only Admin and Shop Owner may soft-delete.

```mermaid
flowchart TD
  S([Start]) --> A[Select a row in the list]
  A --> B{Edit or delete?}
  B -->|Edit| C{Has permission or is record creator?}
  C -->|No| D[Hide button / do not save]
  D --> END1([End])
  C -->|Yes| E[Open modal]
  E --> F{All required fields provided?}
  F -->|No| E
  F -->|Yes| G[Update · write audit log]
  G --> END2([End])
  B -->|Delete| H{Has soft-delete permission?}
  H -->|No| D
  H -->|Yes| I[Confirm]
  I --> J{Confirmed?}
  J -->|No| END1
  J -->|Yes| K[deletedAt · write audit log]
  K --> L[Remove from active list]
  L --> END2

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  classDef stepLite fill:#93C5FD,stroke:#2563EB,color:#1E3A8A
  classDef decision fill:#EFF6FF,stroke:#2563EB,color:#1D4ED8
  class S,END1,END2 startEnd
  class A,E,G,I,K,L step
  class D stepLite
  class B,C,F,H,J decision
```

### 4. Excel import

Admin, Shop Owner, Employee. The mock does not read the actual file contents.

```mermaid
flowchart TD
  S([Start]) --> A[Open Excel Data Import]
  A --> B{Has import permission?}
  B -->|No| C[403]
  C --> END1([End])
  B -->|Yes| D[Choose income or expense]
  D --> E[Choose file]
  E --> F{File is .xlsx or .xls?}
  F -->|No| E
  F -->|Yes| G[Mock preview]
  G --> H[Click Import]
  H --> I{Successful?}
  I -->|No| J[History status FAILED]
  I -->|Yes| K[History status COMPLETED]
  J --> END2([End])
  K --> END2

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  classDef stepLite fill:#93C5FD,stroke:#2563EB,color:#1E3A8A
  classDef decision fill:#EFF6FF,stroke:#2563EB,color:#1D4ED8
  class S,END1,END2 startEnd
  class A,D,E,G,H step
  class C,J,K stepLite
  class B,F,I decision
```

### 5. Reports

Admin, Shop Owner, Viewer. Employee cannot access reports.

```mermaid
flowchart TD
  S([Start]) --> A[Open Reports]
  A --> B{Has report permission?}
  B -->|No| C[403]
  C --> END1([End])
  B -->|Yes| D[Filter by date / category]
  D --> E[Display currency USD or EUR]
  E --> F[View overview · daily · monthly · category]
  F --> G{Export report?}
  G -->|Yes| H[Mock print]
  G -->|No| END2([End])
  H --> END2

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  classDef stepLite fill:#93C5FD,stroke:#2563EB,color:#1E3A8A
  classDef decision fill:#EFF6FF,stroke:#2563EB,color:#1D4ED8
  class S,END1,END2 startEnd
  class A,D,E,F step
  class C,H stepLite
  class B,G decision
```

### 6. Logout

```mermaid
flowchart TD
  S([Start]) --> A[Select Logout]
  A --> B[Clear session]
  B --> C[Return to login screen]
  C --> END([End])

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  class S,END startEnd
  class A,B,C step
```

Amounts are stored in USD; EUR is used only as a display conversion.

## Interface

After login (sidebar + top bar):

- Dashboard
- Income Management
- Expense Management
- Reports & Analytics
- Excel Data Import
- Activity Log
- User Management
- Personal Profile

Screenshots by role:

- [common](docs/images/chung/) — login
- [admin](docs/images/admin/)
- [shop-owner](docs/images/chu-shop/)
- [employee](docs/images/nhan-vien/)
- [viewer](docs/images/nguoi-xem/)

Viewer — income list (no add / edit / delete buttons):

![Viewer — income](docs/images/nguoi-xem/02-khoan-thu.png)

Employee — no Reports, Activity Log, or Users menu items:

![Employee — Dashboard](docs/images/nhan-vien/01-dashboard.png)

## Data

The PostgreSQL design (`database/shop_finance.sql`, `database/shop_finance.dbml`) includes:

- users (phone number, avatar, status)
- income categories and income records (sales channel, record status, pre/post-tax amounts)
- expense categories and expense records (payment method, status)
- attachments
- import batches
- audit logs

The UI data comes from `frontend/js/data.js` (including sample Etsy order `4154185113`). There is one USD dataset; the currency toolbar displays either USD or EUR using a mock exchange rate.

## Repository structure

```text
finance-manager/
  README.md
  frontend/          index.html, css/, js/
  docs/              product documentation
  docs/images/       UI screenshots by role
  database/          shop_finance.sql, shop_finance.dbml
  scripts/           serve.sh, serve.bat
```

## Documentation

- [Scope](docs/01-scope.md)
- [Features](docs/02-features.md)
- [Use cases](docs/03-use-cases.md)
- [Information architecture](docs/04-information-architecture.md)
- [Data model](docs/05-data-model.md)
- [ER diagram](docs/DATABASE.md)
- [Acceptance criteria](docs/06-acceptance-criteria.md)
- [Mind map](docs/mindmap.png)
- [C4 architecture (C1 → C2 → C3)](docs/architecture/c4/README.md)
