# HandmadeFinance Backend

Target ASP.NET Core three-tier solution root for Step 7.

```text
src/backend/
├── HandmadeFinance.sln
├── src/
│   ├── HandmadeFinance.Api/
│   ├── HandmadeFinance.Application/
│   └── HandmadeFinance.Infrastructure/
└── tests/
    ├── HandmadeFinance.Application.Tests/
    ├── HandmadeFinance.Api.Tests/
    └── HandmadeFinance.Infrastructure.Tests/
```

## Implemented baseline

The Step 7 executable baseline now includes the three projects above and an xUnit Application test project.

- Authentication with signed Bearer tokens, PBKDF2 password hashing, safe login errors, and client-side logout.
- Income/expense CRUD with role checks, Employee ownership, validation, paging/filtering, and soft deletion.
- Dashboard/report aggregates, active category lookups, admin user management, and self-service profile/password operations.
- RFC 7807 error responses with stable error codes and trace IDs.
- All 33 OpenAPI routes now have executable handlers, including report export, import preview/history/process, attachment lifecycle, and audit queries.
- The solution contains Application unit tests, HTTP API integration tests, and Infrastructure tests.
- In-memory persistence remains the local executable adapter. PostgreSQL EF/Npgsql, production-grade Excel parsing and durable file/audit storage remain deployment-grade follow-up work from `docs/09-step-7-readiness.md`.

Run:

```powershell
dotnet restore src/backend/HandmadeFinance.slnx
dotnet test src/backend/HandmadeFinance.slnx
dotnet run --project src/backend/src/HandmadeFinance.Api
```

Development seed: `admin@handmade.local` / `ChangeMe123!`. Replace both the seed password and signing key outside local development.
