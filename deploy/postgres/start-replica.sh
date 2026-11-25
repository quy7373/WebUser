#!/bin/bash
set -e

echo ">>> [Replica DB] Đang kiểm tra trạng thái dữ liệu..."

# Kiểm tra nếu chưa có data hoặc mất standby.signal (do failover promote trước đó)
if [ ! -s "$PGDATA/PG_VERSION" ] || [ ! -f "$PGDATA/standby.signal" ]; then
    echo ">>> [Replica DB] Cần đồng bộ Standby. Kiểm tra kết nối db_primary..."
    if pg_isready -h db_primary -p 5432 -U postgres -t 3; then
        echo ">>> [Replica DB] db_primary đang hoạt động. Tiến hành đồng bộ snapshot từ Primary..."
        rm -rf "$PGDATA"/*
        PGPASSWORD='replica_password' pg_basebackup -h db_primary -D "$PGDATA" -U replicator -v -P -R -X stream
        echo ">>> [Replica DB] Đồng bộ hoàn tất! Standby signal đã được kích hoạt."
    elif [ ! -s "$PGDATA/PG_VERSION" ]; then
        echo ">>> [Replica DB] Chưa có data và db_primary chưa sẵn sàng. Đợi db_primary..."
        until pg_isready -h db_primary -p 5432 -U postgres; do
            sleep 2
        done
        rm -rf "$PGDATA"/*
        PGPASSWORD='replica_password' pg_basebackup -h db_primary -D "$PGDATA" -U replicator -v -P -R -X stream
        echo ">>> [Replica DB] Đồng bộ ban đầu hoàn tất!"
    else
        echo ">>> [Replica DB] db_primary không khả dụng nhưng replica đã có dữ liệu, tiếp tục vận hành."
    fi
fi

# Chạy PostgreSQL dưới quyền postgres
exec docker-entrypoint.sh postgres \
    -c hot_standby=on \
    -c primary_conninfo="host=db_primary port=5432 user=replicator password=replica_password application_name=cluster_postgres_replica"
