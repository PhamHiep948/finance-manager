# C2 — Container

> **Mục tiêu:** zoom vào HandmadeFinance và mô tả các khối chạy/lưu trữ ở kiến trúc đích.

```mermaid
flowchart TB
    operator(["👤 Administrator / Shop Owner / Employee"])
    reader(["👤 Viewer"])

    subgraph platform["HandmadeFinance [Software System Boundary]"]
        direction TB
        subgraph presentation["Presentation"]
            web["Web Frontend<br/><i>[Container: React.js + Vite]</i><br/>UI, routing, forms, tables, and charts"]
        end
        subgraph application["Application"]
            backend[".NET Backend<br/><i>[Container: ASP.NET Core Web API]</i><br/>Authentication, RBAC, business rules,<br/>imports, reporting, and auditing"]
        end
        subgraph data["Data"]
            database[("PostgreSQL<br/><i>[Container: Database]</i><br/>Users, categories, incomes, expenses,<br/>imports, attachments, and audit logs")]
        end
    end

    workbook[("Excel Workbook<br/><i>[External Data]</i><br/>User-provided .xlsx / .xls file")]

    operator --> web
    reader --> web
    web -- "REST / HTTPS / JSON" --> backend
    web -- "upload file import" --> backend
    workbook -.->|"selected from the user's device"| web
    backend -- "SQL / PostgreSQL protocol" --> database

    style web fill:#1168bd,color:#fff
    style backend fill:#1168bd,color:#fff
    style database fill:#1168bd,color:#fff
```

## Trách nhiệm

| Container | Công nghệ | Trách nhiệm | Trạng thái |
|---|---|---|---|
| Web Frontend | React.js, Vite | UI, route guard, biểu đồ, form và bảng dữ liệu | Đã có bản mock |
| .NET Backend | C#, ASP.NET Core Web API, REST/JSON | Điểm tin cậy cho xác thực, RBAC, nghiệp vụ và truy cập dữ liệu | Chưa triển khai |
| PostgreSQL | PostgreSQL | Dữ liệu bền vững và quan hệ nghiệp vụ | Đã có schema, chưa kết nối |

## Quy tắc kiến trúc

1. Trình duyệt không truy cập PostgreSQL trực tiếp.
2. Ẩn nút ở frontend chỉ là UX; .NET Backend phải kiểm tra quyền cho mọi request.
3. Tiền được lưu theo USD; EUR chỉ là giá trị quy đổi để hiển thị.
4. Xóa giao dịch là soft delete để giữ lịch sử và audit.
5. Attachment hiện chỉ có metadata; chiến lược lưu binary ở backend chưa được quyết định.

## Trạng thái hiện tại

```mermaid
flowchart LR
    user(["👤 User"])
    react["React Web<br/><i>implemented</i>"]
    mock["Mock Store + Auth<br/><i>JavaScript / Web Storage</i>"]
    pg[("PostgreSQL schema<br/><i>not connected</i>")]
    user --> react --> mock
    pg -.->|"data design only; no runtime connection"| mock
    style react fill:#1168bd,color:#fff
    style mock fill:#3a7bd5,color:#fff
    style pg fill:#999,color:#fff
```

**Trước:** [C1 — System Context](01-system-context.md) · **Tiếp theo:** zoom vào .NET Backend → [C3 — Component](03-component.md).
