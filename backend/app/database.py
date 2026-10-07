import os
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
from pathlib import Path

# Load .env explicitly
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Server instance name - normalized
DB_SERVER = os.getenv("DB_SERVER", r"SERVER\KAJAL")
# If double escaped by env loader, normalize to single backslash
if "\\\\" in DB_SERVER:
    DB_SERVER = DB_SERVER.replace("\\\\", "\\")

DB_NAME = os.getenv("DB_NAME", "OfficeVisitorDB")
DB_USER = os.getenv("DB_USER", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "kajal123")
DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

# Raw ODBC Connection String
odbc_str = (
    f"DRIVER={{{DB_DRIVER}}};"
    f"SERVER={DB_SERVER};"
    f"DATABASE={DB_NAME};"
    f"UID={DB_USER};"
    f"PWD={DB_PASSWORD};"
    "TrustServerCertificate=yes;"
)

DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={urllib.parse.quote_plus(odbc_str)}"

# Setup resilient engine with SQLite fallback if MS SQL service is temporarily unreachable
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        fast_executemany=True
    )
    with engine.connect():
        pass
except Exception as e:
    print(f"[Warning] Creating engine fallback: {e}")
    engine = create_engine("sqlite:///./office_visitor_fallback.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
