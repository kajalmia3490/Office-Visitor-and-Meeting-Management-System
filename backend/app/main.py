import random
import string
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from .database import engine, get_db, Base
from . import models, schemas

# Initialize tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[Notice] Table creation check: {e}")

app = FastAPI(
    title="Office Visitor & Meeting Management API",
    description="Enterprise API for Visitor Registration, Scheduling, Room Booking, Check-in/Out, and Host Notifications",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite port 5173 / any dev port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_passcode(length=6):
    return "PASS-" + "".join(random.choices(string.digits, k=length))

# Initial seed endpoint if database is empty
@app.post("/api/seed", tags=["System"])
def seed_database(db: Session = Depends(get_db)):
    if db.query(models.User).first():
        return {"message": "Database already contains seed data."}
    
    # Users
    u1 = models.User(
        FullName="Washi Mazumder", Email="washi@sage.com", PasswordHash="hashed123",
        Role="Admin", Department="Product Management", Designation="Lead Product Manager",
        Phone="+8801700000001", AvatarUrl="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    )
    u2 = models.User(
        FullName="Barbara Gordon", Email="barbara@sage.com", PasswordHash="hashed123",
        Role="Employee", Department="Design & UI/UX", Designation="Senior Designer",
        Phone="+8801700000002", AvatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    )
    u3 = models.User(
        FullName="Sarah Connor", Email="sarah.reception@sage.com", PasswordHash="hashed123",
        Role="Receptionist", Department="Operations", Designation="Front Desk Lead",
        Phone="+8801700000003", AvatarUrl="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
    )
    db.add_all([u1, u2, u3])
    db.commit()

    # Rooms
    r1 = models.Room(RoomName="Zoom Innovation Lab", Location="Floor 3, East Wing", Capacity=12, Amenities="4K Display, Polycom Video Bar, Dual Whiteboard")
    r2 = models.Room(RoomName="Boardroom 775", Location="775 Rolling Green Rd, Level 4", Capacity=20, Amenities="4K Conference Setup, Smart Mic, Presentation Hub")
    r3 = models.Room(RoomName="Creative UI Studio", Location="Floor 2, Creative Hub", Capacity=8, Amenities="Interactive Touch Board, Dual Monitors")
    db.add_all([r1, r2, r3])
    db.commit()

    # Visitors
    v1 = models.Visitor(FullName="Michael Vance", Email="michael.vance@techcorp.com", Phone="+1-555-0199", Company="TechCorp Solutions", GovtIdNumber="NID-98321045")
    v2 = models.Visitor(FullName="Elena Rostova", Email="elena@novadesign.io", Phone="+1-555-0288", Company="Nova Design Co.", GovtIdNumber="NID-88219432")
    db.add_all([v1, v2])
    db.commit()

    # Meetings
    now = datetime.now()
    m1 = models.Meeting(
        Title="Marketing Strategy Meeting", Description="Quarterly roadmap sync and marketing review",
        HostId=u1.UserId, RoomId=r1.RoomId, MeetingType="Meeting",
        StartTime=now + timedelta(hours=2), EndTime=now + timedelta(hours=3),
        Status="Scheduled", VideoCallUrl="https://zoom.us/j/984218321"
    )
    m2 = models.Meeting(
        Title="Creative UI Workshop", Description="Design system alignment & component handoff session",
        HostId=u2.UserId, RoomId=r2.RoomId, MeetingType="Workshop",
        StartTime=now + timedelta(days=1, hours=2), EndTime=now + timedelta(days=1, hours=4),
        Status="Scheduled", VideoCallUrl="https://meet.google.com/abc-defg-hij"
    )
    db.add_all([m1, m2])
    db.commit()

    # Attendees
    a1 = models.MeetingAttendee(MeetingId=m1.MeetingId, VisitorId=v1.VisitorId, PassCode="PASS-9821", Status="Approved", BadgeIssued=True, BadgeNumber="BDG-001")
    a2 = models.MeetingAttendee(MeetingId=m2.MeetingId, VisitorId=v2.VisitorId, PassCode="PASS-4412", Status="Invited")
    db.add_all([a1, a2])

    # Notifications
    n1 = models.Notification(UserId=u1.UserId, Title="Upcoming Meeting Alert", Message="Marketing Strategy Meeting will start in 2 hours in Zoom Innovation Lab.", NotificationType="MeetingInvite")
    n2 = models.Notification(UserId=u1.UserId, Title="Visitor Pre-Registration", Message="Michael Vance has registered and accepted your meeting invite.", NotificationType="VisitorArrival")
    db.add_all([n1, n2])
    db.commit()

    return {"message": "Database seeded successfully with users, rooms, visitors, and meetings!"}

# --- STATS / SUMMARY ---
@app.get("/api/dashboard/stats", tags=["Dashboard"])
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_meetings = db.query(models.Meeting).count()
    active_visitors = db.query(models.MeetingAttendee).filter(models.MeetingAttendee.Status == "Checked-In").count()
    total_visitors = db.query(models.Visitor).count()
    total_rooms = db.query(models.Room).count()
    upcoming_meetings = db.query(models.Meeting).filter(models.Meeting.StartTime >= datetime.now()).count()
    
    return {
        "total_meetings": total_meetings,
        "active_checked_in_visitors": active_visitors,
        "total_visitors": total_visitors,
        "total_rooms": total_rooms,
        "upcoming_meetings": upcoming_meetings
    }

# --- USERS / EMPLOYEES ---
@app.get("/api/users", response_model=List[schemas.UserResponse], tags=["Users"])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.post("/api/users", response_model=schemas.UserResponse, tags=["Users"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.Email == user.Email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    new_user = models.User(
        FullName=user.FullName,
        Email=user.Email,
        PasswordHash=user.Password, # simplified for dev
        Role=user.Role,
        Department=user.Department,
        Designation=user.Designation,
        Phone=user.Phone,
        AvatarUrl=user.AvatarUrl or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# --- ROOMS ---
@app.get("/api/rooms", response_model=List[schemas.RoomResponse], tags=["Rooms"])
def get_rooms(db: Session = Depends(get_db)):
    return db.query(models.Room).all()

@app.post("/api/rooms", response_model=schemas.RoomResponse, tags=["Rooms"])
def create_room(room: schemas.RoomCreate, db: Session = Depends(get_db)):
    new_room = models.Room(**room.dict())
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

# --- VISITORS ---
@app.get("/api/visitors", response_model=List[schemas.VisitorResponse], tags=["Visitors"])
def get_visitors(db: Session = Depends(get_db)):
    return db.query(models.Visitor).order_by(models.Visitor.VisitorId.desc()).all()

@app.post("/api/visitors", response_model=schemas.VisitorResponse, tags=["Visitors"])
def register_visitor(visitor: schemas.VisitorCreate, db: Session = Depends(get_db)):
    new_visitor = models.Visitor(**visitor.dict())
    db.add(new_visitor)
    db.commit()
    db.refresh(new_visitor)
    return new_visitor

# --- MEETINGS & CALENDAR ---
@app.get("/api/meetings", tags=["Meetings"])
def get_meetings(
    status: Optional[str] = None,
    meeting_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Meeting)
    if status:
        query = query.filter(models.Meeting.Status == status)
    if meeting_type:
        query = query.filter(models.Meeting.MeetingType == meeting_type)
    
    meetings = query.order_by(models.Meeting.StartTime.asc()).all()
    results = []
    for m in meetings:
        results.append({
            "MeetingId": m.MeetingId,
            "Title": m.Title,
            "Description": m.Description,
            "HostId": m.HostId,
            "HostName": m.host.FullName if m.host else "N/A",
            "HostAvatar": m.host.AvatarUrl if m.host else None,
            "RoomId": m.RoomId,
            "RoomName": m.room.RoomName if m.room else "Virtual / Custom Location",
            "RoomLocation": m.room.Location if m.room else None,
            "MeetingType": m.MeetingType,
            "StartTime": m.StartTime.isoformat(),
            "EndTime": m.EndTime.isoformat(),
            "Status": m.Status,
            "VideoCallUrl": m.VideoCallUrl,
            "Attendees": [
                {
                    "AttendeeId": a.AttendeeId,
                    "VisitorId": a.VisitorId,
                    "VisitorName": a.visitor.FullName if a.visitor else "Unknown",
                    "VisitorEmail": a.visitor.Email if a.visitor else "",
                    "VisitorCompany": a.visitor.Company if a.visitor else "",
                    "PassCode": a.PassCode,
                    "Status": a.Status,
                    "BadgeIssued": a.BadgeIssued,
                    "BadgeNumber": a.BadgeNumber,
                    "CheckInTime": a.CheckInTime.isoformat() if a.CheckInTime else None,
                    "CheckOutTime": a.CheckOutTime.isoformat() if a.CheckOutTime else None,
                }
                for a in m.attendees
            ]
        })
    return results

@app.post("/api/meetings", tags=["Meetings"])
def create_meeting(meeting: schemas.MeetingCreate, db: Session = Depends(get_db)):
    new_meeting = models.Meeting(
        Title=meeting.Title,
        Description=meeting.Description,
        HostId=meeting.HostId,
        RoomId=meeting.RoomId,
        MeetingType=meeting.MeetingType,
        StartTime=meeting.StartTime,
        EndTime=meeting.EndTime,
        Status=meeting.Status,
        VideoCallUrl=meeting.VideoCallUrl
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)

    # Attach attendees & generate digital passes
    if meeting.VisitorIds:
        for vid in meeting.VisitorIds:
            visitor = db.query(models.Visitor).filter(models.Visitor.VisitorId == vid).first()
            if visitor:
                pass_code = generate_passcode()
                attendee = models.MeetingAttendee(
                    MeetingId=new_meeting.MeetingId,
                    VisitorId=vid,
                    PassCode=pass_code,
                    Status="Invited"
                )
                db.add(attendee)
                # Notify Host
                db.add(models.Notification(
                    UserId=meeting.HostId,
                    Title="Visitor Invited",
                    Message=f"{visitor.FullName} invited to meeting '{new_meeting.Title}'. Passcode: {pass_code}",
                    NotificationType="MeetingInvite"
                ))
        db.commit()

    return {"message": "Meeting scheduled successfully", "MeetingId": new_meeting.MeetingId}

# --- CHECK-IN / CHECK-OUT / PASS VERIFICATION ---
@app.post("/api/reception/check-in", tags=["Reception & Kiosk"])
def check_in_visitor(req: schemas.CheckInRequest, db: Session = Depends(get_db)):
    attendee = db.query(models.MeetingAttendee).filter(models.MeetingAttendee.PassCode == req.PassCode).first()
    if not attendee:
        raise HTTPException(status_code=404, detail="Invalid Pass Code. No booking found.")
    
    if attendee.Status == "Checked-In":
        raise HTTPException(status_code=400, detail="Visitor is already checked in.")
    
    attendee.Status = "Checked-In"
    attendee.CheckInTime = datetime.now()
    if req.BadgeNumber:
        attendee.BadgeNumber = req.BadgeNumber
        attendee.BadgeIssued = True
    if req.Remarks:
        attendee.Remarks = req.Remarks
    
    # Notify meeting host in real-time
    meeting = attendee.meeting
    if meeting and meeting.host:
        db.add(models.Notification(
            UserId=meeting.HostId,
            Title="Visitor Checked In!",
            Message=f"Your guest {attendee.visitor.FullName} has arrived and checked in for '{meeting.Title}'.",
            NotificationType="VisitorArrival"
        ))
    
    db.commit()
    return {
        "message": "Visitor checked in successfully",
        "visitor_name": attendee.visitor.FullName,
        "meeting_title": meeting.Title if meeting else "",
        "check_in_time": attendee.CheckInTime.isoformat()
    }

@app.post("/api/reception/check-out", tags=["Reception & Kiosk"])
def check_out_visitor(req: schemas.CheckInRequest, db: Session = Depends(get_db)):
    attendee = db.query(models.MeetingAttendee).filter(models.MeetingAttendee.PassCode == req.PassCode).first()
    if not attendee:
        raise HTTPException(status_code=404, detail="Invalid Pass Code.")
    
    attendee.Status = "Checked-Out"
    attendee.CheckOutTime = datetime.now()
    
    db.commit()
    return {
        "message": "Visitor checked out successfully",
        "visitor_name": attendee.visitor.FullName,
        "check_out_time": attendee.CheckOutTime.isoformat()
    }

# --- NOTIFICATIONS ---
@app.get("/api/notifications", response_model=List[schemas.NotificationResponse], tags=["Notifications"])
def get_notifications(user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(models.Notification.UserId == user_id).order_by(models.Notification.CreatedAt.desc()).all()

@app.post("/api/notifications/{notification_id}/read", tags=["Notifications"])
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.NotificationId == notification_id).first()
    if notif:
        notif.IsRead = True
        db.commit()
    return {"message": "Notification updated"}
