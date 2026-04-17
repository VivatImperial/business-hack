#!/usr/bin/env bash
# Восстанавливает базу данных из backup при первом запуске
set -euo pipefail

BACKUP_PATH="/var/opt/mssql/backup/cleaned.bak"
DB_NAME="${MSSQL_DATABASE:-service_desk_tdbb}"
SA_PASSWORD="${MSSQL_SA_PASSWORD:?}"
SQLCMD="/opt/mssql-tools/bin/sqlcmd"

echo "Waiting for SQL Server to start..."
for i in $(seq 1 60); do
    if $SQLCMD -S localhost -U SA -P "$SA_PASSWORD" -Q "SELECT 1" -b -o /dev/null 2>/dev/null; then
        echo "SQL Server is ready"
        break
    fi
    if [ "$i" -eq 60 ]; then
        echo "ERROR: SQL Server did not start in time"
        exit 1
    fi
    sleep 2
done

# Check if DB already exists
EXISTS=$($SQLCMD -S localhost -U SA -P "$SA_PASSWORD" -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name='$DB_NAME'" -h -1 -b 2>/dev/null | tr -d '[:space:]')

if [ "$EXISTS" = "0" ]; then
    echo "Restoring $DB_NAME from backup..."

    FILELIST=$($SQLCMD -S localhost -U SA -P "$SA_PASSWORD" -Q "RESTORE FILELISTONLY FROM DISK = '$BACKUP_PATH'" -W -s "|" -h -1 -b)
    MOVE_CLAUSES=()
    DATA_INDEX=0
    LOG_INDEX=0

    while IFS="|" read -r LOGICAL_NAME PHYSICAL_NAME FILE_TYPE _; do
        LOGICAL_NAME=$(echo "$LOGICAL_NAME" | xargs)
        PHYSICAL_NAME=$(echo "$PHYSICAL_NAME" | xargs)
        FILE_TYPE=$(echo "$FILE_TYPE" | xargs)

        if [ -z "$LOGICAL_NAME" ] || [ -z "$PHYSICAL_NAME" ] || [ -z "$FILE_TYPE" ]; then
            continue
        fi

        EXTENSION="${PHYSICAL_NAME##*.}"
        if [ "$FILE_TYPE" = "L" ]; then
            if [ "$LOG_INDEX" -eq 0 ]; then
                TARGET_NAME="${DB_NAME}_log.${EXTENSION}"
            else
                TARGET_NAME="${DB_NAME}_log_${LOG_INDEX}.${EXTENSION}"
            fi
            LOG_INDEX=$((LOG_INDEX + 1))
        else
            if [ "$DATA_INDEX" -eq 0 ]; then
                TARGET_NAME="${DB_NAME}.${EXTENSION}"
            else
                TARGET_NAME="${DB_NAME}_data_${DATA_INDEX}.${EXTENSION}"
            fi
            DATA_INDEX=$((DATA_INDEX + 1))
        fi

        MOVE_CLAUSES+=("MOVE '$LOGICAL_NAME' TO '/var/opt/mssql/data/$TARGET_NAME'")
    done <<< "$FILELIST"

    if [ "${#MOVE_CLAUSES[@]}" -eq 0 ]; then
        echo "ERROR: backup file list is empty"
        exit 1
    fi

    RESTORE_SQL="RESTORE DATABASE [$DB_NAME] FROM DISK = '$BACKUP_PATH' WITH ${MOVE_CLAUSES[0]}"
    for ((i = 1; i < ${#MOVE_CLAUSES[@]}; i++)); do
        RESTORE_SQL+=", ${MOVE_CLAUSES[$i]}"
    done
    RESTORE_SQL+=", REPLACE"

    $SQLCMD -S localhost -U SA -P "$SA_PASSWORD" -Q "$RESTORE_SQL" -b
    echo "Database restored successfully"
else
    echo "Database $DB_NAME already exists, skipping restore"
fi
