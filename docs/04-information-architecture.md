# Information architecture

```text
HandmadeFinance
│
├── Public
│   └── Login (two-column layout)
│
└── Authenticated (sidebar + topbar)
    ├── Dashboard
    ├── Income Management
    │   ├── List (table, filters, columns, pagination)
    │   ├── Add / edit modal
    │   └── Detail modal
    ├── Expense Management
    │   ├── List
    │   ├── Add / edit modal
    │   └── Detail modal
    ├── Reports & Analytics
    │   ├── Overview
    │   ├── By day
    │   ├── By month
    │   ├── By income category
    │   └── By expense category
    ├── Excel Data Import
    ├── Activity Log
    ├── User Management
    ├── Personal Profile
    │   ├── Account
    │   ├── Security
    │   └── Roles & Permissions
    └── 403
```

Hash routes: `#/login` `#/dashboard` `#/incomes` `#/incomes/new` `#/incomes/edit/:id` `#/expenses` … `#/reports` `#/import` `#/audit` `#/users` `#/profile` `#/403`.

Income/expense forms open as a **modal** on the list page (hash `/new` and `/edit/:id` are still allowed, then return to the list and open the modal).

**Currency** toolbar: USD / EUR. There is one dataset (USD); EUR is display-only conversion.

## Page permissions

| Page | Who can access |
|---|---|
| Dashboard, profile | all roles |
| Income / expenses (view) | all roles |
| Add/edit income/expenses | according to matrix; employee can edit own records |
| Reports | ADMIN, SHOP_OWNER, VIEWER |
| Excel Data Import | ADMIN, SHOP_OWNER, EMPLOYEE |
| Activity Log | ADMIN, SHOP_OWNER |
| Users | ADMIN only |
| Unauthorized | `#/403` |

Unauthorized items are **not rendered** in the sidebar.
