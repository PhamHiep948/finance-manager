# HandmadeFinance

Web quản lý thu – chi cho shop handmade: ghi nhận tiền vào, tiền ra, theo dõi tổng doanh thu, tổng chi phí và lợi nhuận ròng theo thời gian và theo loại. Số liệu lưu USD; trên giao diện đổi sang EUR lúc xem.

Giao diện HTML/CSS/JS tĩnh (**HandmadeFinance**), dữ liệu chạy trên trình duyệt. Repository có thiết kế PostgreSQL cho cùng mô hình.

![Dashboard](docs/images/admin/01-dashboard.png)

## Chức năng chính

- Đăng nhập, đăng xuất, phân quyền theo vai trò trên giao diện
- Dashboard: tổng doanh thu, tổng chi phí, lợi nhuận ròng, số giao dịch, biểu đồ, theo loại thu, giao dịch gần đây
- Quản lý khoản thu: danh sách đủ cột (ẩn/hiện cột), modal thêm/sửa, modal chi tiết; tên sản phẩm, mã đơn, khu vực EU, kênh bán, SL, đơn giá, Item / Discount / Subtotal / Shipping / Tax, trước thuế / % thuế / sau thuế, trạng thái hồ sơ
- Quản lý khoản chi: cùng luồng; người nhận, phạm vi nội địa/quốc tế, phương thức thanh toán, % thuế, tiền sau thuế
- Báo cáo & phân tích: tổng quan, theo ngày, theo tháng, theo loại thu, theo loại chi, xuất báo cáo (in)
- Import dữ liệu Excel: chọn file, xem trước, lịch sử trên giao diện
- Nhật ký hoạt động
- Người dùng (Admin): thêm/sửa, bật/tắt, avatar
- Hồ sơ: tài khoản (SĐT, avatar), bảo mật, vai trò & quyền hạn

## Vai trò

Có bốn vai trò. Menu và nút chỉ hiện khi có quyền.

| | Admin | Chủ shop | Nhân viên | Người xem |
|---|---|---|---|---|
| Dashboard | Có | Có | Có | Có |
| Xem thu / chi | Có | Có | Có | Có |
| Thêm thu / chi | Có | Có | Có | |
| Sửa thu / chi | Có | Có | Bản mình tạo | |
| Xóa mềm thu / chi | Có | Có | | |
| Import dữ liệu Excel | Có | Có | Có | |
| Báo cáo | Có | Có | | Có |
| Nhật ký hoạt động | Có | Có | | |
| Người dùng | Có | | | |
| Hồ sơ cá nhân | Có | Có | Có | Có |

Tài khoản demo (mật khẩu `123456`):

- `admin@demo.local` — Quản trị viên
- `owner@demo.local` — Chủ shop
- `staff@demo.local` — Nhân viên
- `viewer@demo.local` — Người xem

![Đăng nhập](docs/images/chung/01-dang-nhap.png)

## Mind map

![Mind map HandmadeFinance](docs/mindmap.png)

## Workflow

Nhiều luồng riêng, cùng khung: hình viên thuốc = bắt đầu/kết thúc, chữ nhật = bước, thoi = Yes / No. Nút không hiện nếu thiếu quyền; URL không đủ quyền → `#/403`.

### 1. Đăng nhập

```mermaid
flowchart TD
  S([Bắt đầu]) --> A[Mở HandmadeFinance]
  A --> B[Nhập email và mật khẩu]
  B --> C{Tài khoản đúng và đang hoạt động?}
  C -->|No| D[Hiện lỗi trên form]
  D --> B
  C -->|Yes| E[Lưu session]
  E --> F[Mở Dashboard]
  F --> END([Kết thúc])

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  classDef stepLite fill:#93C5FD,stroke:#2563EB,color:#1E3A8A
  classDef decision fill:#EFF6FF,stroke:#2563EB,color:#1D4ED8
  class S,END startEnd
  class A,B,E,F step
  class D stepLite
  class C decision
```

### 2. Ghi khoản thu hoặc chi

Admin, Chủ shop, Nhân viên. Người xem không có nút thêm.

```mermaid
flowchart TD
  S([Bắt đầu]) --> A[Từ Dashboard mở khoản thu hoặc chi]
  A --> B{Có quyền thêm?}
  B -->|No| C[403 hoặc ẩn nút]
  C --> END1([Kết thúc])
  B -->|Yes| D[Mở modal nhập]
  D --> E{Đủ trường bắt buộc?}
  E -->|No| D
  E -->|Yes| F[Lưu USD · source MANUAL]
  F --> G{Có chứng từ?}
  G -->|Yes| H[Lưu tên / type / size]
  G -->|No| I[Ghi nhật ký]
  H --> I
  I --> J[Hiện trên danh sách]
  J --> END2([Kết thúc])

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  classDef stepLite fill:#93C5FD,stroke:#2563EB,color:#1E3A8A
  classDef decision fill:#EFF6FF,stroke:#2563EB,color:#1D4ED8
  class S,END1,END2 startEnd
  class A,D,F,I,J step
  class C,H stepLite
  class B,E,G decision
```

### 3. Sửa hoặc xóa mềm

Nhân viên chỉ sửa bản mình tạo. Chỉ Admin và Chủ shop được xóa mềm.

```mermaid
flowchart TD
  S([Bắt đầu]) --> A[Chọn dòng trên danh sách]
  A --> B{Sửa hay xóa?}
  B -->|Sửa| C{Đủ quyền hoặc đúng người tạo?}
  C -->|No| D[Ẩn nút / không lưu]
  D --> END1([Kết thúc])
  C -->|Yes| E[Mở modal]
  E --> F{Đủ trường bắt buộc?}
  F -->|No| E
  F -->|Yes| G[Cập nhật · ghi nhật ký]
  G --> END2([Kết thúc])
  B -->|Xóa| H{Có quyền xóa mềm?}
  H -->|No| D
  H -->|Yes| I[Xác nhận]
  I --> J{Đồng ý?}
  J -->|No| END1
  J -->|Yes| K[deletedAt · ghi nhật ký]
  K --> L[Biến khỏi danh sách active]
  L --> END2

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  classDef stepLite fill:#93C5FD,stroke:#2563EB,color:#1E3A8A
  classDef decision fill:#EFF6FF,stroke:#2563EB,color:#1D4ED8
  class S,END1,END2 startEnd
  class A,E,G,I,K,L step
  class D stepLite
  class B,C,F,H,J decision
```

### 4. Import Excel

Admin, Chủ shop, Nhân viên. Không đọc nội dung file thật.

```mermaid
flowchart TD
  S([Bắt đầu]) --> A[Mở Import dữ liệu Excel]
  A --> B{Có quyền import?}
  B -->|No| C[403]
  C --> END1([Kết thúc])
  B -->|Yes| D[Chọn khoản thu hoặc khoản chi]
  D --> E[Chọn file]
  E --> F{File .xlsx hoặc .xls?}
  F -->|No| E
  F -->|Yes| G[Preview mock]
  G --> H[Bấm Import]
  H --> I{Thành công?}
  I -->|No| J[Lịch sử FAILED]
  I -->|Yes| K[Lịch sử COMPLETED]
  J --> END2([Kết thúc])
  K --> END2

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  classDef stepLite fill:#93C5FD,stroke:#2563EB,color:#1E3A8A
  classDef decision fill:#EFF6FF,stroke:#2563EB,color:#1D4ED8
  class S,END1,END2 startEnd
  class A,D,E,G,H step
  class C,J,K stepLite
  class B,F,I decision
```

### 5. Báo cáo

Admin, Chủ shop, Người xem. Nhân viên không vào được.

```mermaid
flowchart TD
  S([Bắt đầu]) --> A[Mở Báo cáo]
  A --> B{Có quyền báo cáo?}
  B -->|No| C[403]
  C --> END1([Kết thúc])
  B -->|Yes| D[Lọc ngày / loại]
  D --> E[Đổi tiền USD hoặc EUR]
  E --> F[Xem tổng quan · ngày · tháng · loại]
  F --> G{Xuất báo cáo?}
  G -->|Yes| H[In mock]
  G -->|No| END2([Kết thúc])
  H --> END2

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  classDef stepLite fill:#93C5FD,stroke:#2563EB,color:#1E3A8A
  classDef decision fill:#EFF6FF,stroke:#2563EB,color:#1D4ED8
  class S,END1,END2 startEnd
  class A,D,E,F step
  class C,H stepLite
  class B,G decision
```

### 6. Đăng xuất

```mermaid
flowchart TD
  S([Bắt đầu]) --> A[Chọn Đăng xuất]
  A --> B[Xóa session]
  B --> C[Về màn hình đăng nhập]
  C --> END([Kết thúc])

  classDef startEnd fill:#1D4ED8,stroke:#1D4ED8,color:#fff
  classDef step fill:#2563EB,stroke:#1E40AF,color:#fff
  class S,END startEnd
  class A,B,C step
```

Số liệu lưu USD; EUR chỉ đổi lúc xem.

## Giao diện

Sau khi đăng nhập (sidebar + topbar):

- Dashboard
- Quản lý khoản thu
- Quản lý khoản chi
- Báo cáo & Phân tích
- Import dữ liệu Excel
- Nhật ký hoạt động
- Quản lý người dùng
- Hồ sơ cá nhân

Ảnh theo từng vai trò:

- [chung](docs/images/chung/) — đăng nhập
- [admin](docs/images/admin/)
- [chu-shop](docs/images/chu-shop/)
- [nhan-vien](docs/images/nhan-vien/)
- [nguoi-xem](docs/images/nguoi-xem/)

Người xem — danh sách khoản thu (không nút thêm / sửa / xóa):

![Người xem — khoản thu](docs/images/nguoi-xem/02-khoan-thu.png)

Nhân viên — không có Báo cáo, Nhật ký, Người dùng trên menu:

![Nhân viên — Dashboard](docs/images/nhan-vien/01-dashboard.png)

## Dữ liệu

Thiết kế PostgreSQL (`database/shop_finance.sql`, `database/shop_finance.dbml`) gồm:

- người dùng (SĐT, avatar, trạng thái)
- loại thu, khoản thu (kênh bán, trạng thái hồ sơ, trước/sau thuế)
- loại chi, khoản chi (phương thức thanh toán, trạng thái)
- chứng từ
- đợt import
- nhật ký

Số liệu trên giao diện lấy từ `frontend/js/data.js` (có mẫu đơn Etsy `4154185113`). Một bộ dữ liệu USD; toolbar Đổi tiền xem USD hoặc EUR (tỷ giá mock).

## Cấu trúc repository

```text
finance-manager/
  README.md
  frontend/          index.html, css/, js/
  docs/              tài liệu sản phẩm
  docs/images/       ảnh UI theo vai trò
  database/          shop_finance.sql, shop_finance.dbml
  scripts/           serve.sh, serve.bat
```

## Tài liệu

- [Phạm vi](docs/01-scope.md)
- [Chức năng](docs/02-features.md)
- [Use case](docs/03-use-cases.md)
- [Kiến trúc thông tin](docs/04-information-architecture.md)
- [Mô hình dữ liệu](docs/05-data-model.md)
- [Sơ đồ ER](docs/DATABASE.md)
- [Tiêu chí chấp nhận](docs/06-acceptance-criteria.md)
- [Mind map](docs/mindmap.png)
- [C4 kiến trúc (C1–C2)](docs/architecture/c4/README.md)
