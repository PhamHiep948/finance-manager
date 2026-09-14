# 10. Quality Requirements

Mapped to [QG-1 … QG-5](01-introduction-and-goals.md). Do not invent production service-level agreements. Where no benchmark has been established, use **Proposed Target** or **To Be Determined before production**.

Structure: ID, Quality Attribute, Scenario, Environment, Expected Response, Measurement.

## QR-01 Authorization

|                       |                                                              |
| --------------------- | ------------------------------------------------------------ |
| **ID**                | QR-01                                                        |
| **Quality Attribute** | Security / Authorization (QG-2)                              |
| **Scenario**          | A logged-in VIEWER calls `POST` to create Income (or Expense, Import) |
| **Environment**       | Go Backend + PostgreSQL; independent of React hiding the button |
| **Expected Response** | 403 Forbidden; no INSERT into incomes/expenses/import_batches |
| **Measurement**       | API test; audit contains no business INSERT for that user    |

## QR-02 Employee own-update and no-delete

|                       |                                                       |
| --------------------- | ----------------------------------------------------- |
| **ID**                | QR-02                                                 |
| **Quality Attribute** | Security                                              |
| **Scenario**          | EMPLOYEE edits a record created by another user, or attempts soft delete |
| **Environment**       | Authenticated API                                     |
| **Expected Response** | 403; record remains unchanged / `deleted_at` remains NULL |
| **Measurement**       | Test against `created_by`                             |

## QR-03 Data Integrity — USD and active set

|                       |                                                                         |
| --------------------- | ----------------------------------------------------------------------- |
| **ID**                | QR-03                                                                   |
| **Quality Attribute** | Data Correctness (QG-1)                                                 |
| **Scenario**          | Create Income with a currency other than USD, or Dashboard includes a soft-deleted record |
| **Environment**       | API + database CHECK + views                                                  |
| **Expected Response** | Reject currency ≠ USD; key performance indicators and reports include only `deleted_at IS NULL`    |
| **Measurement**       | SQL constraint; compare API totals with active `SUM(amount)`            |

## QR-04 Auditability

|                       |                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------- |
| **ID**                | QR-04                                                                                         |
| **Quality Attribute** | Auditability (QG-3)                                                                           |
| **Scenario**          | Successful login; soft-delete expense; confirm import; export report                          |
| **Environment**       | Backend + `audit_logs`                                                                        |
| **Expected Response** | LOGIN / DELETE / IMPORT / EXPORT records with actor, module, timestamp; no password/hash       |
| **Measurement**       | Query `audit_logs`; review payload                                                            |

## QR-05 Import atomicity

|                       |                                                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                | QR-05                                                                                                                                                                         |
| **Quality Attribute** | Data Integrity                                                                                                                                                                |
| **Scenario**          | Confirm import; some rows fail during processing                                                                                                                              |
| **Environment**       | Excel Import + Persistence transaction                                                                                                                                        |
| **Expected Response** | **Proposed** policy: either the entire batch becomes FAILED with no partial transaction commit, or success_rows/failed_rows satisfy constraints; final status is COMPLETED or FAILED, never stuck in PROCESSING |
| **Measurement**       | `import_batches` counts; `success_rows + failed_rows <= total_rows`                                                                                                           |

## QR-06 Performance (dashboard)

|                       |                                                                      |
| --------------------- | -------------------------------------------------------------------- |
| **ID**                | QR-06                                                                |
| **Quality Attribute** | Performance                                                          |
| **Scenario**          | User opens Dashboard using the default date range with V1 single-shop data |
| **Environment**       | Go + Postgres local/production To Be Determined                                         |
| **Expected Response** | **Proposed Target:** 95th percentile latency under 2 seconds. **To Be Determined before production** if not measured |
| **Measurement**       | GET dashboard API latency                                            |

## QR-07 Recoverability

|                       |                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| **ID**                | QR-07                                                                                                 |
| **Quality Attribute** | Recoverability                                                                                        |
| **Scenario**          | PostgreSQL volume is lost                                                                             |
| **Environment**       | Local Docker volume; production To Be Determined                                                                   |
| **Expected Response** | Local: volume `handmade_postgres_data` — backup **To Be Determined**. Production restore **To Be Determined before production** |
| **Measurement**       | Backup runbook exists / does not exist                                                                |

## QR-08 Usability — role shell

|                       |                                                             |
| --------------------- | ----------------------------------------------------------- |
| **ID**                | QR-08                                                       |
| **Quality Attribute** | Usability (QG-4)                                            |
| **Scenario**          | VIEWER opens app; EMPLOYEE opens `#/reports`                |
| **Environment**       | React + API                                                 |
| **Expected Response** | VIEWER does not see add/edit/delete/import; EMPLOYEE receives 403 for reports |
| **Measurement**       | Role × menu checklist (`docs/03-use-cases.md`)              |

## QR-09 Maintainability — persistence boundary

|                       |                                                                    |
| --------------------- | ------------------------------------------------------------------ |
| **ID**                | QR-09                                                              |
| **Quality Attribute** | Maintainability (QG-5)                                             |
| **Scenario**          | Add a field to `incomes`                                           |
| **Environment**       | Go modules                                                         |
| **Expected Response** | SQL remains inside Persistence; Income Management contains no SQL driver code |
| **Measurement**       | PR review / architecture test (**Proposed**)                       |
