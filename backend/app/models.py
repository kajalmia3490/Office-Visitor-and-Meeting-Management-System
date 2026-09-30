import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "Users"

    UserId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    FullName = Column(String(150), nullable=False)
    Email = Column(String(150), unique=True, index=True, nullable=False)
    PasswordHash = Column(String(255), nullable=False)
    Role = Column(String(50), nullable=False, default="Employee")  # 'Admin', 'Employee', 'Receptionist'
    Department = Column(String(100), nullable=True)
    Designation = Column(String(100), nullable=True)
    Phone = Column(String(50), nullable=True)
    AvatarUrl = Column(String(500), nullable=True)
    IsActive = Column(Boolean, nullable=False, default=True)
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    hosted_meetings = relationship("Meeting", back_populates="host", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "Rooms"

    RoomId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    RoomName = Column(String(100), nullable=False)
    Location = Column(String(150), nullable=False)
    Capacity = Column(Integer, nullable=False, default=6)
    Amenities = Column(String(300), nullable=True)
    IsAvailable = Column(Boolean, nullable=False, default=True)
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    meetings = relationship("Meeting", back_populates="room")


class Visitor(Base):
    __tablename__ = "Visitors"

    VisitorId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    FullName = Column(String(150), nullable=False)
    Email = Column(String(150), index=True, nullable=False)
    Phone = Column(String(50), nullable=False)
    Company = Column(String(150), nullable=True)
    GovtIdNumber = Column(String(100), nullable=True)
    Address = Column(String(250), nullable=True)
    PhotoUrl = Column(String(500), nullable=True)
    QrCodeKey = Column(String(100), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    attendances = relationship("MeetingAttendee", back_populates="visitor", cascade="all, delete-orphan")


class Meeting(Base):
    __tablename__ = "Meetings"

    MeetingId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Title = Column(String(200), nullable=False)
    Description = Column(Text, nullable=True)
    HostId = Column(Integer, ForeignKey("Users.UserId", ondelete="CASCADE"), nullable=False)
    RoomId = Column(Integer, ForeignKey("Rooms.RoomId", ondelete="SET NULL"), nullable=True)
    MeetingType = Column(String(50), nullable=False, default="Meeting") # 'Meeting', 'Workshop', 'Holiday', 'Leave', 'Event'
    StartTime = Column(DateTime, nullable=False)
    EndTime = Column(DateTime, nullable=False)
    Status = Column(String(50), nullable=False, default="Scheduled") # 'Scheduled', 'In-Progress', 'Completed', 'Cancelled'
    VideoCallUrl = Column(String(500), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    host = relationship("User", back_populates="hosted_meetings")
    room = relationship("Room", back_populates="meetings")
    attendees = relationship("MeetingAttendee", back_populates="meeting", cascade="all, delete-orphan")


class MeetingAttendee(Base):
    __tablename__ = "MeetingAttendees"

    AttendeeId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    MeetingId = Column(Integer, ForeignKey("Meetings.MeetingId", ondelete="CASCADE"), nullable=False)
    VisitorId = Column(Integer, ForeignKey("Visitors.VisitorId", ondelete="CASCADE"), nullable=False)
    PassCode = Column(String(50), nullable=False)
    Status = Column(String(50), nullable=False, default="Invited") # 'Invited', 'Approved', 'Checked-In', 'Checked-Out', 'No-Show'
    CheckInTime = Column(DateTime, nullable=True)
    CheckOutTime = Column(DateTime, nullable=True)
    BadgeIssued = Column(Boolean, nullable=False, default=False)
    BadgeNumber = Column(String(50), nullable=True)
    Remarks = Column(String(500), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    meeting = relationship("Meeting", back_populates="attendees")
    visitor = relationship("Visitor", back_populates="attendances")


class Notification(Base):
    __tablename__ = "Notifications"

    NotificationId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    UserId = Column(Integer, ForeignKey("Users.UserId", ondelete="CASCADE"), nullable=False)
    Title = Column(String(200), nullable=False)
    Message = Column(Text, nullable=False)
    NotificationType = Column(String(50), nullable=False, default="System") # 'MeetingInvite', 'VisitorArrival', 'System', 'CheckInAlert'
    IsRead = Column(Boolean, nullable=False, default=False)
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")
