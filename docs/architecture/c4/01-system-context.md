# C1 — System Context

What context does HandmadeFinance operate in, who uses it, and where is the system boundary?

C4 flow: **C1** → [C2 Container](02-container.md) → [C3 Component](03-component.md)

This is step 1: view the system from the outside, without discussing technology yet.

![C1 System Context — HandmadeFinance](c1-system-context.jpg)

Image file: [c1-system-context.jpg](c1-system-context.jpg)

## How to read the diagram

One **Software System** is in the center. Four **Persons** are around it, each with one relationship to the system.

There is no **External Software System** at C1 level.

## System

| | |
|---|---|
| **Name** | HandmadeFinance |
| **Type** | Software System |
| **Description** | Income and expense management system for a handmade shop, tracking revenue, expenses, net cashflow, and financial reports. |

**Inside HandmadeFinance:** login, dashboard, income/expenses, categories, reports, data import, audit log, users, profiles, and role-based access control.

**Outside:** the four user roles; manual shop processes outside the software; third-party systems not included in V1 (ERP, SKU inventory, payment gateways, marketplace APIs).

## People

The four roles come from `frontend/js/auth.js` (`ADMIN`, `SHOP_OWNER`, `EMPLOYEE`, `VIEWER`).

| Actor | On the diagram | Relationship to HandmadeFinance |
| ----- | -------------- | -------------------------------- |
| Shop Owner | Manages and monitors the shop's income and expenses | Manages and monitors income and expenses |
| Admin | Administers users and system-management functions | Administers the system and users |
| Employee | Performs income/expense operations according to assigned permissions | Records transactions according to permissions |
| Viewer | Views data and reports according to access rights | Views data and reports |

## External Systems

No external software systems are currently required at the System Context level.

V1 does not use payment gateways or marketplace APIs.

## Next step

Zoom into HandmadeFinance to view its Containers: [C2 — Container](02-container.md).

## Source of Truth

- Diagram: `c1-system-context.jpg`
- `README.md` (repo)
- `docs/01-scope.md`
- `docs/02-features.md`
- `docs/03-use-cases.md`
- `frontend/js/auth.js`
- `frontend/js/data.js`
