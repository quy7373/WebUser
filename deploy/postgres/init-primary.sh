#!/bin/bash
set -e

echo ">>> [Primary DB] Đang cấu hình người dùng Replication..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE replicator WITH REPLICATION LOGIN ENCRYPTED PASSWORD 'replica_password';
    ALTER SYSTEM SET synchronous_commit = 'local';
    ALTER SYSTEM SET synchronous_standby_names = '';
    ALTER SYSTEM SET statement_timeout = '15s';
EOSQL

# Cho phép replicator kết nối từ mọi container trong mạng Docker
echo "host replication replicator all md5" >> "$PGDATA/pg_hba.conf"

# Nạp lại cấu hình
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT pg_reload_conf();"

echo ">>> [Primary DB] Cấu hình Replication Streaming hoàn tất (Không treo SyncRep)!"
