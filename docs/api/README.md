# HandmadeFinance API Documentation

The API contract is defined in [OpenAPI 3.0.4](openapi.yaml). It is the source of truth for HTTP paths, request and response bodies, authentication, errors, and role access.

## Contract scope

- Authentication and profile management
- Dashboard and transaction categories
- Income and expense CRUD with soft deletion
- Excel import preview, submission, and status
- Transaction attachments
- Reports and report export
- Audit log access
- Administrator user management

All endpoints are versioned under `/api/v1`. Monetary values use USD; any EUR conversion belongs to the presentation layer.

## Authentication and authorization

Protected operations use an HTTP Bearer JWT. The custom `x-roles` field documents the roles allowed to call each operation:

- `ADMIN` — Administrator
- `SHOP_OWNER` — Shop Owner
- `EMPLOYEE` — Employee
- `VIEWER` — Viewer

For operations marked with `x-own-record-role: EMPLOYEE`, an employee may update only a record they created. The backend must enforce both RBAC and ownership.

## Errors

Errors use `application/problem+json` and RFC 7807-compatible `ProblemDetails`. Validation failures use `ValidationProblemDetails` with field-level error arrays.

## View the contract

Paste the contents of `openapi.yaml` into [Swagger Editor](https://editor.swagger.io/) or serve it with Swagger UI/ReDoc. The future ASP.NET Core project should expose the same contract without renaming paths or schemas.

Lint locally (requires Node.js):

```bash
npx.cmd @redocly/cli lint docs/api/openapi.yaml
```

Repository root `redocly.yaml` disables the unused `info.license` rules because this project has not declared a license yet.

## Import transaction policy

Excel processing is all-or-nothing. Preview never inserts business records. During processing, any invalid row rolls back all income or expense inserts for that batch; the batch is retained as `FAILED` with row errors. A valid file commits every row and marks the batch `COMPLETED`.
