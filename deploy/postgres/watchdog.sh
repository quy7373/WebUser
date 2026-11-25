#!/bin/bash
# =========================================================================
# PostgreSQL Auto-Failover Watchdog
# Giám sát DB Primary. Nếu DB1 sập -> Tự động Promote DB2 thành Master Ghi/Đọc
# =========================================================================

echo ">>> [Watchdog] Khởi động tiến trình giám sát High Availability cho Database..."

FAIL_COUNT=0
MAX_FAILS=3
PROMOTED=false

# Chờ hệ thống khởi động ổn định
sleep 10

while true; do
    if [ "$PROMOTED" = false ]; then
        # Kiểm tra sức khỏe DB Primary
        if pg_isready -h db_primary -p 5432 -U postgres -d adduser_db -t 2 > /dev/null 2>&1; then
            FAIL_COUNT=0
        else
            FAIL_COUNT=$((FAIL_COUNT + 1))
            echo ">>> [Watchdog] CẢNH BÁO: DB Primary không phản hồi (Lần $FAIL_COUNT / $MAX_FAILS)"

            if [ $FAIL_COUNT -ge $MAX_FAILS ]; then
                echo ">>> [Watchdog] !!! DB PRIMARY ĐÃ SẬP HOÀN TOÀN !!!"
                echo ">>> [Watchdog] Đang tự động kích hoạt (PROMOTE) DB REPLICA thành PRIMARY mới..."

                export PGPASSWORD=postgrespassword
                # Gửi lệnh nâng cấp DB Replica thành Primary cho phép Ghi
                psql -h db_replica -p 5432 -U postgres -d adduser_db -c "SELECT pg_promote();"
                
                # Tách riêng từng câu lệnh ALTER SYSTEM để tránh lỗi transaction block
                psql -h db_replica -p 5432 -U postgres -d adduser_db -c "ALTER SYSTEM SET synchronous_standby_names = '';"
                psql -h db_replica -p 5432 -U postgres -d adduser_db -c "ALTER SYSTEM SET synchronous_commit = 'local';"
                psql -h db_replica -p 5432 -U postgres -d adduser_db -c "SELECT pg_reload_conf();"

                # Kích hoạt DB Replica trên HAProxy Gateway
                echo "enable server postgres_backend/db_replica" | nc -w 2 db_gateway 9999 || true
                echo "shutdown sessions server postgres_backend/db_primary" | nc -w 2 db_gateway 9999 || true

                echo ">>> [Watchdog] THÀNH CÔNG: DB Replica đã chuyển thành Primary Read/Write và Gateway đã cập nhật!"
                PROMOTED=true
            fi
        fi
    else
        # Khi đã promote DB Replica, kiểm tra nếu DB Primary được khôi phục trở lại
        if pg_isready -h db_primary -p 5432 -U postgres -d adduser_db -t 2 > /dev/null 2>&1; then
            # Kiểm tra xem db_primary có đang hoạt động ở chế độ Master không
            IS_PRIMARY=$(PGPASSWORD=postgrespassword psql -h db_primary -p 5432 -U postgres -d adduser_db -t -A -c "SELECT pg_is_in_recovery();" 2>/dev/null || echo "t")
            if [ "$IS_PRIMARY" = "f" ]; then
                echo ">>> [Watchdog] DB Primary đã phục hồi hoạt động bình thường (Read/Write). Reset trạng thái Gateway..."
                echo "disable server postgres_backend/db_replica" | nc -w 2 db_gateway 9999 || true
                echo "shutdown sessions server postgres_backend/db_replica" | nc -w 2 db_gateway 9999 || true
                PROMOTED=false
                FAIL_COUNT=0
            fi
        fi
    fi

    sleep 2
done
