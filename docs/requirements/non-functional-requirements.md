# Non-Functional Requirements — HandmadeFinance V1

> Design status: DRAFT  
> Implementation status: NOT IMPLEMENTED

No numeric target is introduced without project-owner approval.

## Performance

### Confirmed

- List endpoints are paginated and `pageSize` is capped by the OpenAPI contract.
- Dashboard and report queries operate on active transaction data and designed reporting views.

### TBD

- Response-time targets.
- Dataset-size assumptions.
- Concurrent-user target.
- Export and import processing limits.

## Security

### Confirmed

- Backend authorization is authoritative.
- Passwords, password hashes, JWTs, secrets, and sensitive file content must not appear in logs or audit payloads.
- Uploaded file type, size, and signature are validated server-side.
- Files are stored outside the web root behind `IFileStorage`.

### TBD

- Access-token lifetime.
- Logout revocation strategy.
- Password-strength policy beyond current schema minima.
- Login throttling/rate limiting.
- Account lockout policy.

## Reliability

### Confirmed

- Import transaction insertion is all-or-nothing.
- Attachment storage/metadata failures require compensation or retry-safe cleanup.

### TBD

- Availability objective.
- Retry policy.
- Background job guarantees if asynchronous import is selected.

## Maintainability

### Confirmed

- Application does not depend on API or Infrastructure.
- Controllers contain no SQL or business rules.
- OpenAPI is the HTTP contract source of truth.
- Feature/module ownership is defined in `07-folder-structure.md`.

### TBD

- Code coverage threshold.
- Static-analysis quality threshold beyond zero build errors.

## Accessibility

### Confirmed

- Inputs have visible labels.
- Status is not communicated by color alone.
- Keyboard navigation and modal focus management are required.

### TBD

- Formal WCAG conformance level and audit method.

## Logging and audit

### Confirmed

- Logs include trace identifiers but exclude credentials, tokens, hashes, secrets, and raw file content.
- Business audit records preserve actor and record context where available.

### TBD

- Log retention.
- Audit retention.
- Soft-delete audit action semantics.

## Backup and recovery

### Confirmed

- Financial records use soft deletion to retain history.

### TBD

- Backup frequency and retention.
- Recovery-point objective.
- Recovery-time objective.
- File-storage backup strategy.
