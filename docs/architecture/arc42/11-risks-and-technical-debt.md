# 11. Risks and Technical Debt

The frontend baseline for this documentation is **React.js**.

## 11.1 Architecture Risk

| ID | Risk | Consequence | Direction |
| -- | ---- | ----------- | --------- |
| R-01 | Attachment / import file storage is not decided | `storage_path` cannot be deployed end-to-end | Storage ADR; record as Open Decision |
| R-02 | Production topology To Be Determined | No standardized HTTPS/backup/host design | Section 7 is logical only |
| R-03 | Session/authentication protocol To Be Determined | Architecture Decision Record 008 cannot be fully implemented yet | Decide cookie vs token later; never bypass Identity |
| R-04 | EUR exchange-rate source To Be Determined | Wrong conversion can distort displayed reports (the database remains USD) | Exchange-rate Architecture Decision Record; clearly label “display only” |
| R-05 | Excel parser To Be Determined | Production import depends on an unselected library | Spike; preserve batch/status flow |
| R-06 | No OpenAPI specification yet | React and .NET API contracts may drift | Specify before implementation |
| R-07 | Monitoring/observability To Be Determined | Hard to verify QR-06/QR-07 in production | To Be Determined |

## 11.2 Technical Debt

| ID | Debt | Notes |
| -- | ---- | ----- |
| TD-01 | Schema contains audit triggers but .NET Backend does not yet exist | Align app-level LOGIN/EXPORT/IMPORT with triggers |
| TD-02 | Transaction policy for partially failing imports (QR-05) is not decided: all-or-nothing vs partial | Requires a short ADR when implementing Excel Import |
| TD-03 | Employee delete permission matrix has `canDeleteOwn = false` | Backend must follow the use-case matrix; do not invent “own delete” |

## 11.3 Open Decision

| Topic | Status |
| ----- | ------ |
| ASP.NET Core API style | To Be Determined |
| SQL access (Entity Framework Core, Dapper, ADO.NET, …) | To Be Determined |
| Password hashing | To Be Determined |
| Authentication session mechanism | To Be Determined |
| File storage (disk vs object store) | To Be Determined — do not default to S3/MinIO |
| Exchange-rate source | To Be Determined |
| Excel parse library | To Be Determined |
| Production host / Transport Layer Security / backup | To Be Determined |
| Continuous Integration / Continuous Delivery, metrics, log aggregator | To Be Determined |
| JSON error envelope | To Be Determined |

Consequence of ADR-001…005: implementation must follow the React + .NET + PostgreSQL baseline; until a Platform as a Service is selected, risk R-02 remains open.
