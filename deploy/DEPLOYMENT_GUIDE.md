# Hướng Dẫn Triển Khai Cụm Chịu Lỗi Cao (High Availability & Auto-Failover)

Tài liệu này giải quyết chính xác 2 bài toán chịu lỗi theo yêu cầu của bạn:
1. **3 Backend Server Nối Tầng:** Bình thường chạy Server 1; nếu Server 1 sập thì tự nhảy qua Server 2; nếu Server 2 sập tiếp thì tự nhảy qua Server 3.
2. **2 Database Đồng Bộ 100% & Tự Động Chuyển (Auto-Failover):** DB1 và DB2 đồng bộ dữ liệu thời gian thực (Synchronous Replication - Zero Data Loss). Nếu DB1 sập, DB2 tự động được kích hoạt thành Primary và nhận lệnh ghi/đọc bình thường mà backend không bị gián đoạn.

---

## 1. Sơ Đồ Cơ Chế Hoạt Động (Architecture & Failover Flow)

```
                            [ Người Dùng / Trình Duyệt ]
                                         │
                                         ▼
                     ┌────────────────────────────────────────┐
                     │          Nginx Failover Proxy          │
                     │  (Cổng 8080 - Cơ chế Nối tầng Backup)  │
                     └───────────────────┬────────────────────┘
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  ▼ (Ưu tiên số 1)       ▼ (Dự phòng 1)         ▼ (Dự phòng 2)
        ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
        │   App Server 1   │   │   App Server 2   │   │   App Server 3   │
        │  [XỬ LÝ CHÍNH]   │   │  [KHI 1 SẬP]     │   │  [KHI 1 & 2 SẬP] │
        └─────────┬────────┘   └─────────┬────────┘   └─────────┬────────┘
                  │                      │                      │
                  └──────────────────────┼──────────────────────┘
                                         ▼
                     ┌────────────────────────────────────────┐
                     │       HAProxy Database Gateway         │
                     │  (Cổng ảo 5432 - Tự động route DB)     │
                     └───────────────────┬────────────────────┘
                                         │
                       ┌─────────────────┴─────────────────┐
                       ▼ (Bình thường)                     ▼ (Khi DB 1 sập)
            ┌─────────────────────┐              ┌─────────────────────┐
            │  PostgreSQL DB 1    │              │  PostgreSQL DB 2    │
            │  (Primary Master)   │              │  (Replica Standby)  │
            └──────────┬──────────┘              └──────────▲──────────┘
                       │                                    │
                       └──── Synchronous Replication WAL ───┘
                               (Đồng bộ thời gian thực)
                                        ▲
                                        │ (Tự động Promote khi DB1 chết)
                               ┌────────┴────────┐
                               │   DB Watchdog   │
                               └─────────────────┘
```

---

## 2. Cách Hoạt Động Chi Tiết

### A. Đối Với 3 Backend Server (Server 1 -> Server 2 -> Server 3)
Cấu hình trong [`deploy/nginx/nginx.conf`](file:///d:/Web%20Application/deploy/nginx/nginx.conf):
```nginx
upstream backend_cluster {
    server app_server_1:5001 max_fails=1 fail_timeout=3s;
    server app_server_2:5001 max_fails=1 fail_timeout=3s backup;
    server app_server_3:5001 max_fails=1 fail_timeout=3s backup;
}
```
* **Bình thường:** Nginx chỉ gửi request đến `app_server_1`.
* **Server 1 sập:** Nginx phát hiện trong 1 thất bại và chuyển ngay lập tức sang `app_server_2` bằng `proxy_next_upstream`.
* **Server 2 sập tiếp:** Nginx tự động chuyển tiếp sang `app_server_3`.
* **Server 1 sống lại:** Nginx tự động chuyển traffic chính trở lại `app_server_1`.

---

### B. Đối Với 2 Database (Đồng Bộ Dữ Liệu & Auto-Failover)
Gồm 3 thành phần phối hợp nhịp nhàng:
1. **Đồng bộ thời gian thực (Zero Data Loss):**
   * DB1 bật chế độ `synchronous_commit = on` và `synchronous_standby_names = 'FIRST 1 (cluster_postgres_replica)'`.
   * Bất kỳ thao tác thêm/xóa/sửa nào tại DB1 **bắt buộc phải được ghi nhận vào DB2** trước khi trả về thành công cho client. Dữ liệu trên 2 DB luôn luôn khớp nhau 100%.
2. **HAProxy Gateway (`cluster_db_gateway`):**
   * Đóng vai trò cổng kết nối database duy nhất cho cả 3 Backend Server (`db_gateway:5432`).
   * Bình thường chuyển hướng toàn bộ kết nối vào DB1.
   * Khi DB1 chết, HAProxy tự động chuyển mọi kết nối sang DB2.
3. **Tiến trình Giám sát (`cluster_db_watchdog`):**
   * Liên tục ping kiểm tra DB1 mỗi 2 giây.
   * Nếu DB1 mất kết nối 3 lần liên tiếp: Watchdog lập tức thực thi câu lệnh SQL:
     ```sql
     SELECT pg_promote();
     ```
     Lệnh này biến **DB2 (Replica)** lập tức trở thành **Primary** cho phép Đọc & Ghi đầy đủ.
   * Toàn bộ 3 backend server tiếp tục hoạt động bình thường mà không cần restart!

---

## 3. Các Bước Khởi Động & Kiểm Thử Sự Cố (Chaos Testing)

### Bước 1: Khởi động hệ thống
```bash
docker compose -f docker-compose.cluster.yml up -d --build
```

### Bước 2: Khởi tạo database ban đầu
```bash
docker exec -it cluster_app_server_1 npx prisma db push
```

---

### Kịch Bản Test 1: Kiểm thử Server 1 sập -> Tự qua Server 2 -> Tự qua Server 3

1. **Gọi kiểm tra khi cả 3 server đang sống:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8080/api/health" | Select-Object serverInstance, status
   ```
   *Kết quả:* `App-Server-01 (Primary Server)` đang xử lý.

2. **Cố tình tắt Server 1 (Simulate Server 1 crash):**
   ```bash
   docker stop cluster_app_server_1
   ```
   Gọi lại API:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8080/api/health" | Select-Object serverInstance, status
   ```
   *Kết quả:* Nginx lập tức chuyển sang **`App-Server-02 (Backup 1)`**. Không có lỗi 502/504!

3. **Cố tình tắt tiếp Server 2 (Simulate Server 2 crash):**
   ```bash
   docker stop cluster_app_server_2
   ```
   Gọi lại API:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8080/api/health" | Select-Object serverInstance, status
   ```
   *Kết quả:* Nginx lập tức chuyển sang **`App-Server-03 (Backup 2)`**.

4. **Bật lại Server 1:**
   ```bash
   docker start cluster_app_server_1
   ```
   Gọi lại API: Nginx tự động phục hồi về **`App-Server-01 (Primary Server)`**.

---

### Kịch Bản Test 2: Kiểm thử DB 1 sập -> DB 2 tự lên Master & Dữ liệu đồng bộ

1. **Thêm một người dùng mới vào hệ thống qua giao diện UI** (`http://localhost:8080`).
   Dữ liệu được lưu vào DB1 và đồng bộ tức thì sang DB2.

2. **Cố tình tắt DB 1 (Simulate DB1 crash):**
   ```bash
   docker stop cluster_postgres_primary
   ```

3. **Xem log của Watchdog:**
   ```bash
   docker logs -f cluster_db_watchdog
   ```
   *Bạn sẽ thấy log:*
   ```text
   >>> [Watchdog] CẢNH BÁO: DB Primary không phản hồi (Lần 1 / 3)
   >>> [Watchdog] CẢNH BÁO: DB Primary không phản hồi (Lần 2 / 3)
   >>> [Watchdog] CẢNH BÁO: DB Primary không phản hồi (Lần 3 / 3)
   >>> [Watchdog] !!! DB PRIMARY ĐÃ SẬP HOÀN TOÀN !!!
   >>> [Watchdog] Đang tự động kích hoạt (PROMOTE) DB REPLICA thành PRIMARY mới...
   >>> [Watchdog] THÀNH CÔNG: DB Replica đã chuyển thành Primary Read/Write!
   ```

4. **Thao tác trên giao diện UI:**
   * Tải lại trang: Toàn bộ danh sách người dùng vẫn nguyên vẹn 100%.
   * Thêm tiếp người dùng mới: Request vẫn **thành công 100%**, dữ liệu mới được ghi trực tiếp vào DB 2 mà không hề bị lỗi kết nối!
