# Office Visitor and Meeting Management System (OVMS)

## 📌 Project Overview
An enterprise-grade Office Visitor and Meeting Management System built with **React (TypeScript) + Tailwind CSS**, **Python FastAPI**, and **Microsoft SQL Server (MS SQL)**, designed with modern aesthetic principles inspired by Sage UI (glassmorphism, subtle micro-interactions, responsive sidebar navigation, interactive calendar, fast receptionist check-in kiosk, and host notifications).

---

## 🏗️ System Architecture & Deliverables

```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI REST endpoints & notification dispatch
│   │   ├── models.py        # SQLAlchemy MS SQL entity models
│   │   ├── schemas.py       # Pydantic schema validation
│   │   └── database.py      # MS SQL connection via pyodbc
│   ├── requirements.txt     # Python backend dependencies
│   └── .env                 # Database server configuration (SERVER\KAJAL)
│
├── database/
│   └── schema.sql           # Complete T-SQL MS SQL Server Database Schema
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.tsx             # Sage UI sidebar with light/dark switch
    │   │   ├── Header.tsx              # Quick Search (⌘ + S), Notification Tray
    │   │   ├── CalendarView.tsx        # Event preview cards & Monthly calendar
    │   │   ├── FastCheckInView.tsx     # Reception desk & Security badge issuer
    │   │   ├── VisitorsDesk.tsx        # Visitor directory & pre-registration
    │   │   ├── RoomsDesk.tsx           # Conference rooms manager
    │   │   └── CreateMeetingModal.tsx  # Meeting scheduling modal
    │   ├── services/
    │   │   └── api.ts                  # Axios API service layer
    │   ├── types/
    │   │   └── index.ts                # Domain TypeScript models
    │   ├── App.tsx                     # Main application layout
    │   └── index.css                   # Tailwind CSS styling
    ├── package.json
    └── vite.config.ts
```

---

## 🎯 Task & Scope Breakdown

### In-Scope Tasks
1. **Requirement Analysis & Use Case Modeling**:
   - Visitor pre-registration & invitation workflow.
   - Meeting room reservation and schedule collision prevention.
   - Front-desk digital pass verification (`PASS-XXXX`) and badge assignment (`BDG-XXX`).
   - Automated host notification dispatch when a visitor checks in.
2. **System Planning & UML Design**:
   - Conceptual class models and Entity-Relationship structure in MS SQL Server.
3. **Database & UI/UX Design**:
   - Normalized MS SQL relational schema (`Users`, `Rooms`, `Visitors`, `Meetings`, `MeetingAttendees`, `Notifications`).
   - Sage-inspired clean interface with quick search shortcuts, filter bars, calendar views, and dark mode.
4. **System Development**:
   - Interactive React + TypeScript components.
   - Python FastAPI asynchronous backend endpoints with Swagger `/docs`.
5. **Software Testing & Verification**:
   - Automated frontend type-checking and bundling verification.

### Out-of-Scope Items
- ❌ Physical hardware procurement or installation (ID scanners, badge printers, biometric machines, physical servers).
- ❌ On-site staff training beyond documentation delivery.
- ❌ Production hosting infrastructure and ongoing physical security personnel management.

---

## 🚀 How to Run the Project

### 1. Database Setup (MS SQL Server)
1. Open **SQL Server Management Studio (SSMS)** and connect to `SERVER\KAJAL`.
2. Open and execute `database/schema.sql` to generate `OfficeVisitorDB` with all tables and seed data.

### 2. Python FastAPI Backend
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs: `http://localhost:8000/docs`

### 3. Frontend Web App
```bash
cd frontend
npm run dev
```
- Open `http://localhost:5173` in your browser.
