# Acceptance criteria (V1 mock)

## AUTH-01 Mock login

Done when:

- All 4 demo accounts can log in from the HandmadeFinance screen.
- An incorrect password produces an error.
- Users cannot enter the app before logging in.
- Logout clears the session.
- Incorrect role access → 403.
- Viewer does not see add/edit/delete/import actions.

## INC-01 Create income mock

Done when:

- The add-income modal can be opened.
- Required fields are validated.
- A record is added to the mock data with `source = MANUAL`.
- The user can enter order code, sales region, quantity, unit price, Item/Discount/Shipping/Tax, tax rate, pre-tax amount, and post-tax amount.
- Mock Etsy order `4154185113` exists (Lily Flower, 22.10 USD before tax).
- Amounts are stored in USD; form/list can display EUR.
- A mock audit entry is created.

## EXP-01 Soft delete expense

Done when:

- The object is not removed with `splice`.
- `deletedAt` / `deletedBy` are set.
- The record disappears from the active list.
- A mock audit entry is created.

## EXP-02 Origin + tax + payment

Done when:

- Domestic or International can be selected.
- The list includes pre-tax, tax-rate, and post-tax columns.
- Post-tax amount defaults to amount × (1 + tax rate / 100).
- The detail modal shows payment method and record status.

## USR-01 Profile

Done when:

- The Account tab can edit full name and phone number (mock).
- The Security tab supports a mock password change.
- The Roles tab is read-only; users cannot elevate their own permissions.

## RPT-01 Currency + category

Done when:

- One dataset is used; switching USD ↔ EUR does not split the list.
- Category filter uses `INCOME:id` / `EXPENSE:id`.
