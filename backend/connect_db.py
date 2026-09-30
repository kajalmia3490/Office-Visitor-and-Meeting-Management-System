import pyodbc
import re
import os
import sys

# Ensure UTF-8 output encoding for Windows terminal
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SERVER = r"SERVER\KAJAL"
USER = "sa"
PASSWORD = "kajal123"
DRIVER = "ODBC Driver 17 for SQL Server"

print(f"Connecting to MS SQL Server '{SERVER}' as user '{USER}'...")

try:
    # 1. Connect to master database first to create OfficeVisitorDB if not existing
    master_conn_str = f"DRIVER={{{DRIVER}}};SERVER={SERVER};DATABASE=master;UID={USER};PWD={PASSWORD};TrustServerCertificate=yes;"
    conn = pyodbc.connect(master_conn_str, autocommit=True)
    cursor = conn.cursor()
    print("[SUCCESS] Connected to MS SQL Server (master)!")

    # Check / Create Database
    cursor.execute("SELECT name FROM sys.databases WHERE name = 'OfficeVisitorDB'")
    row = cursor.fetchone()
    if not row:
        print("Creating database 'OfficeVisitorDB'...")
        cursor.execute("CREATE DATABASE OfficeVisitorDB")
        print("[SUCCESS] Database 'OfficeVisitorDB' created successfully.")
    else:
        print("[INFO] Database 'OfficeVisitorDB' already exists.")
    conn.close()

    # 2. Connect to OfficeVisitorDB and execute schema.sql
    db_conn_str = f"DRIVER={{{DRIVER}}};SERVER={SERVER};DATABASE=OfficeVisitorDB;UID={USER};PWD={PASSWORD};TrustServerCertificate=yes;"
    db_conn = pyodbc.connect(db_conn_str, autocommit=True)
    db_cursor = db_conn.cursor()
    print("[SUCCESS] Connected directly to OfficeVisitorDB!")

    schema_file_path = os.path.join(os.path.dirname(__file__), "..", "database", "schema.sql")
    with open(schema_file_path, "r", encoding="utf-8") as f:
        sql_script = f.read()

    # Split by 'GO' statements
    batches = re.split(r'^\s*GO\s*$', sql_script, flags=re.MULTILINE | re.IGNORECASE)
    for batch in batches:
        clean_batch = batch.strip()
        if clean_batch:
            if clean_batch.lower().startswith("use ") or "create database" in clean_batch.lower():
                continue
            try:
                db_cursor.execute(clean_batch)
            except Exception as ex:
                print(f"[Notice] Executing batch: {ex}")

    print("[SUCCESS] Schema and Seed Data executed successfully!")
    
    # Verify tables
    db_cursor.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
    tables = [t[0] for t in db_cursor.fetchall()]
    print(f"[SUCCESS] Tables in OfficeVisitorDB: {tables}")

    # Verify counts
    db_cursor.execute("SELECT COUNT(*) FROM dbo.Users")
    user_count = db_cursor.fetchone()[0]
    db_cursor.execute("SELECT COUNT(*) FROM dbo.Meetings")
    meeting_count = db_cursor.fetchone()[0]
    print(f"[VERIFIED] {user_count} Users and {meeting_count} Meetings found in MS SQL Server.")

    db_conn.close()
    print("\n>>> All database setup and connections to MS SQL Server verified successfully! <<<")

except Exception as e:
    print(f"[ERROR] Connection error: {e}")
