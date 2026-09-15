# C1 — System Context

> **Mục tiêu:** ai sử dụng HandmadeFinance và hệ thống chịu trách nhiệm gì, chưa đi vào công nghệ.

```mermaid
flowchart LR
    admin(["👤 Administrator"])
    owner(["👤 Shop Owner"])
    employee(["👤 Employee"])
    viewer(["👤 Viewer"])

    subgraph boundary[" "]
        finance["HandmadeFinance<br/><i>[Software System]</i><br/>Manages income, expenses, reports,<br/>data imports, users, and audit logs"]
    end

    admin -- "manages users and all financial data" --> finance
    owner -- "manages finances, reports, and audit logs" --> finance
    employee -- "records income and expenses within permissions" --> finance
    viewer -- "views dashboards, transactions, and reports" --> finance

    style finance fill:#1168bd,color:#fff
```

## Ranh giới hệ thống

HandmadeFinance chịu trách nhiệm đăng nhập, phân quyền, dashboard, khoản thu, khoản chi, báo cáo, import Excel, audit log, quản lý người dùng và hồ sơ cá nhân.

Ngoài phạm vi V1: tồn kho/SKU, CRM, kế toán kép, hóa đơn điện tử, thanh toán trực tuyến, Etsy API và ERP. Vì chưa có tích hợp thật với hệ thống bên ngoài nên C1 không vẽ marketplace hoặc payment gateway.

## Người dùng và quyền chính

| Person | Quyền chính |
|---|---|
| Quản trị viên | Toàn quyền, bao gồm quản lý người dùng |
| Chủ shop | Quản lý thu chi, import, báo cáo và audit log |
| Nhân viên | Tạo thu chi, chỉ sửa bản ghi do mình tạo, được import |
| Người xem | Chỉ xem dashboard, thu chi, báo cáo và hồ sơ |

**Tiếp theo:** zoom vào Software System → [C2 — Container](02-container.md).

**Nguồn sự thật:** `app/src/lib/auth.js`, `docs/01-scope.md`, `docs/03-use-cases.md`.
