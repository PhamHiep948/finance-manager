# C4 Model — HandmadeFinance

Tài liệu này đọc **từ ngoài vào trong**. Mỗi level zoom vào một khối của level trước.

```text
C1  System Context
    Người dùng  →  HandmadeFinance
         │
         │  zoom vào Software System
         ▼
C2  Container
    Người dùng  →  Web Frontend  →  Go Backend  →  PostgreSQL
         │
         │  zoom vào Go Backend
         ▼
C3  Component
    Web Frontend  →  HTTP API  →  Identity / nghiệp vụ  →  Persistence  →  PostgreSQL
```

Chưa có Level 4 Code.

## Luồng đọc

| Bước | Level | Câu hỏi | Zoom từ | Zoom vào |
| ---- | ----- | ------- | ------- | -------- |
| 1 | [C1 System Context](01-system-context.md) | Ai dùng hệ thống? Ranh giới ở đâu? | Bối cảnh shop | HandmadeFinance |
| 2 | [C2 Container](02-container.md) | Hệ thống gồm những khối chạy nào? | HandmadeFinance | Frontend, Go Backend, PostgreSQL |
| 3 | [C3 Component](03-component.md) | Go Backend chia module thế nào? | Go Backend | HTTP API, Identity, thu/chi, import, báo cáo, audit, persistence |

## C1 — System Context

![C1 System Context](c1-system-context.jpg)

Bốn **Person** dùng một **Software System**. Không có hệ thống bên ngoài.

→ Tiếp: [C2 Container](02-container.md)

## C2 — Container

![C2 Container](c2-container.jpg)

Zoom C1: bên trong HandmadeFinance là Web Frontend (React.js) → REST/HTTPS/JSON → Go Backend → SQL → PostgreSQL.

→ Trước: [C1](01-system-context.md) · Tiếp: [C3 Component](03-component.md)

## C3 — Component

![C3 Component](c3-component.png)

Zoom C2: bên trong **Go Backend** (Planned). Frontend và PostgreSQL giữ nguyên vai Container. Request đi HTTP API → xác thực → module nghiệp vụ → Persistence → database.

→ Trước: [C2](02-container.md)

## Architecture status

| Level | Status | Ghi chú |
| ----- | ------ | ------- |
| C1 | Defined | Bốn vai trò; không External System |
| C2 | Target | Frontend React.js; Go Backend Planned; schema PostgreSQL đã thiết kế |
| C3 | Target | Component là module logic của Go Backend, chưa có mã Go |
| C4 Code | Not documented | |

Current State: frontend mock (`frontend/js/data.js`, `frontend/js/auth.js`). Không `fetch` API. Postgres chạy độc lập qua Docker, app không nối.

## Current Architecture Decisions

1. Frontend target technology is React.js.
2. Backend target technology is Go (modular monolith).
3. PostgreSQL is the primary relational database.
4. Frontend must not connect directly to PostgreSQL.
5. Mọi request nghiệp vụ đi qua HTTP API rồi Identity & Access trước khi vào module domain.
6. Persistence / Data Access là chỗ duy nhất nói chuyện SQL với PostgreSQL.
7. C4 documentation currently stops at Level 3.
