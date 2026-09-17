# HandmadeFinance API Documentation

## Overview

This is the API contract for HandmadeFinance. The contract is defined in `openapi.yaml` and is the source of truth for HTTP paths, methods, request and response bodies, authentication, errors, and role access.

The ASP.NET Core backend is not fully implemented yet. Future backend work must follow this contract. Do not assume that every documented endpoint is available at runtime.

## API scope

- Authentication
- Profile
- Dashboard
- Categories
- Income
- Expenses
- Reports
- Imports
- Attachments
- Audit logs
- Administrator user management

## Base URLs

- Relative: `/api/v1`
- Local: `http://localhost:5000/api/v1`
- Production URL: not defined yet

## Authentication

Send the JWT access token in the `Authorization` header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Login does not require a token. All other operations use Bearer JWT unless an operation sets `security: []`.

V1 does not define a refresh token. After logout, the client discards its access token. Token revocation is not part of this contract.

## Content types

- `application/json` — JSON request and success response bodies
- `application/problem+json` — error responses
- `multipart/form-data` — Excel import and attachment uploads
- `application/pdf` — report export when `format=PDF`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` — report export when `format=XLSX`

## Dates, times and currency

- Dates use `YYYY-MM-DD`.
- Date-times use ISO 8601.
- Monetary values are stored and returned in USD.
- EUR conversion belongs only to the presentation layer.

## Pagination

- `page` is one-based. The minimum value is `1`. The default is `1`.
- `pageSize` defaults to `20`. The maximum is `100`.
- Paginated responses contain `items` and `meta`.
- `meta` contains:
  - `page`
  - `pageSize`
  - `totalItems`
  - `totalPages`

An empty list still returns HTTP 200 with `items: []`. For an empty first page, `meta.totalItems` and `meta.totalPages` are `0`.

## Roles and authorization

- `ADMIN` — Administrator
- `SHOP_OWNER` — Shop Owner
- `EMPLOYEE` — Employee
- `VIEWER` — Viewer

`x-roles` lists the roles allowed to call an operation. `x-own-record-role` marks a role that may act only on a record it created. The backend is the authorization boundary and must enforce both RBAC and ownership. The OpenAPI document describes the intended rules; it does not replace server-side checks.

## Errors

Errors use RFC 7807-compatible Problem Details. The content type is `application/problem+json`.

- `errorCode` is the stable machine-readable code for frontend and API consumers.
- `detail` is a human-readable message. Do not use `detail` as a programmatic condition.
- `traceId` correlates the response with server logs.
- Validation errors include an `errors` object. Each key is a field name. Each value is an array of messages.

Primary `errorCode` values:

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_INVALID`
- `ACCESS_DENIED`
- `VALIDATION_FAILED`
- `RESOURCE_NOT_FOUND`
- `BUSINESS_CONFLICT`
- `FILE_TOO_LARGE`
- `INTERNAL_SERVER_ERROR`

## Sample cURL: login

```bash
curl --request POST \
  --url http://localhost:5000/api/v1/auth/login \
  --header "Content-Type: application/json" \
  --data '{
    "email": "owner@handmadefinance.local",
    "password": "ExamplePassword123!"
  }'
```

## Sample cURL: list incomes

```bash
curl --request GET \
  --url "http://localhost:5000/api/v1/incomes?page=1&pageSize=20&dateFrom=2026-09-01&dateTo=2026-09-30" \
  --header "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  --header "Accept: application/json"
```

## Sample cURL: create income

```bash
curl --request POST \
  --url http://localhost:5000/api/v1/incomes \
  --header "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --header "Accept: application/json" \
  --data '{
    "incomeDate": "2026-09-15",
    "description": "Etsy order HF-2026-001",
    "incomeCategoryId": 1,
    "amount": 125.00,
    "currencyCode": "USD",
    "referenceCode": "PAY-10001",
    "orderCode": "HF-2026-001",
    "saleRegion": "IN_EU",
    "salesChannel": "ETSY_STORE",
    "recordStatus": "COMPLETED",
    "productQty": 2,
    "unitPrice": 60.00,
    "itemTotal": 120.00,
    "discountAmount": 5.00,
    "discountCode": "WELCOME5",
    "subtotal": 115.00,
    "shippingAmount": 10.00,
    "taxAmount": 0.00,
    "taxPercent": 0.00,
    "amountAfterTax": 125.00,
    "note": "Paid through Etsy"
  }'
```

## Sample cURL: preview Excel import

```bash
curl --request POST \
  --url http://localhost:5000/api/v1/imports/preview \
  --header "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  --form "importType=INCOME" \
  --form "file=@/path/to/file.xlsx"
```

## View and validate

Paste the contents of `openapi.yaml` into Swagger Editor or serve it with Swagger UI or ReDoc.

Validate locally (requires Node.js):

```bash
npx.cmd @redocly/cli lint docs/api/openapi.yaml
```

Bundle the contract to confirm that all `$ref` values resolve:

```bash
npx.cmd @redocly/cli bundle docs/api/openapi.yaml
```

Repository root `redocly.yaml` disables unused `info.license` rules because this project has not declared a license yet.

## Import policy

- Preview validates the Excel file and returns row-level results. It does not create income or expense records.
- Import processing is all-or-nothing.
- If any row is invalid, the batch does not insert income or expense records.
- The batch is still stored with status `FAILED` and row errors.
- If the file is valid, every row is committed and the batch is marked `COMPLETED`.

## Implementation status

`openapi.yaml` is the API contract. The ASP.NET Core backend has not been generated or implemented fully. Runtime behavior cannot be verified against controllers, DTOs, or live responses yet. When the backend is built, controllers, DTOs, and responses must stay aligned with this OpenAPI document.
