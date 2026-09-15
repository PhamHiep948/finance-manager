# 7. Deployment View

## 7.1 Hiện tại — mock local

```mermaid
flowchart LR
    subgraph machine["Máy phát triển"]
        browser["Browser<br/><i>React runtime</i>"]
        vite["Vite dev server<br/><i>static assets/HMR</i>"]
        mock["JavaScript mock data<br/>Web Storage session"]
        docker["Docker Compose"]
        pg[("PostgreSQL<br/>port 5432")]
        browser -->|"HTTP"| vite
        browser --> mock
        docker --> pg
    end
    mock -.->|"không kết nối"| pg
    style browser fill:#1168bd,color:#fff
    style vite fill:#3a7bd5,color:#fff
    style mock fill:#3a7bd5,color:#fff
    style pg fill:#999,color:#fff
    style machine fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```

Frontend chạy bằng `npm run dev`; PostgreSQL có thể chạy độc lập bằng Docker Compose nhưng frontend không gọi database.

## 7.2 Kiến trúc đích — topology logic

```mermaid
flowchart LR
    device["Client device<br/><i>Browser</i>"]
    web["Web hosting node<br/><i>React static assets</i>"]
    api["Application node<br/><i>ASP.NET Core application</i>"]
    db[("Database node<br/><i>PostgreSQL</i>")]
    device -->|"HTTPS"| web
    web -->|"HTTPS / REST / JSON"| api
    api -->|"TLS / PostgreSQL protocol"| db
    style device fill:#666,color:#fff
    style web fill:#3a7bd5,color:#fff
    style api fill:#1168bd,color:#fff
    style db fill:#3a7bd5,color:#fff
```

Đây là topology logic, không khẳng định cloud provider, container orchestrator, reverse proxy hay CDN.

## 7.3 Mapping container → node

| Container | Local hiện tại | Production đích |
|---|---|---|
| React Web | Vite dev server + browser | Static web hosting, TBD |
| .NET Backend | Chưa có | Một hoặc nhiều ASP.NET Core application instances, TBD |
| PostgreSQL | Docker Compose | Managed/self-hosted PostgreSQL, TBD |

## 7.4 Deployment requirements

- Chỉ public HTTPS endpoints cần thiết; PostgreSQL không public Internet.
- Secret không commit vào Git; dùng environment/secret manager phù hợp.
- Database migration chạy có kiểm soát trước phiên bản backend cần schema mới.
- Health check cần tách liveness và readiness khi backend được triển khai.
- Backup/restore, TLS termination, scaling và observability phải được quyết định trước production.
