from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

# User Schemas
class UserBase(BaseModel):
    FullName: str
    Email: EmailStr
    Role: str = "Employee"
    Department: Optional[str] = None
    Designation: Optional[str] = None
    Phone: Optional[str] = None
    AvatarUrl: Optional[str] = None
    IsActive: bool = True

class UserCreate(UserBase):
    Password: str

class UserResponse(UserBase):
    UserId: int
    CreatedAt: datetime

    class Config:
        from_attributes = True

# Room Schemas
class RoomBase(BaseModel):
    RoomName: str
    Location: str
    Capacity: int = 6
    Amenities: Optional[str] = None
    IsAvailable: bool = True

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    RoomId: int
    CreatedAt: datetime

    class Config:
        from_attributes = True

# Visitor Schemas
class VisitorBase(BaseModel):
    FullName: str
    Email: str
    Phone: str
    Company: Optional[str] = None
    GovtIdNumber: Optional[str] = None
    Address: Optional[str] = None
    PhotoUrl: Optional[str] = None

class VisitorCreate(VisitorBase):
    pass

class VisitorResponse(VisitorBase):
    VisitorId: int
    CreatedAt: datetime

    class Config:
        from_attributes = True

# Meeting Attendee Schemas
class MeetingAttendeeBase(BaseModel):
    VisitorId: int
    PassCode: Optional[str] = None
    Status: str = "Invited"
    BadgeIssued: bool = False
    BadgeNumber: Optional[str] = None
    Remarks: Optional[str] = None

class MeetingAttendeeResponse(MeetingAttendeeBase):
    AttendeeId: int
    MeetingId: int
    CheckInTime: Optional[datetime] = None
    CheckOutTime: Optional[datetime] = None
    Visitor: Optional[VisitorResponse] = None

    class Config:
        from_attributes = True

# Meeting Schemas
class MeetingBase(BaseModel):
    Title: str
    Description: Optional[str] = None
    HostId: int
    RoomId: Optional[int] = None
    MeetingType: str = "Meeting" # 'Meeting', 'Workshop', 'Holiday', 'Leave', 'Event'
    StartTime: datetime
    EndTime: datetime
    Status: str = "Scheduled"
    VideoCallUrl: Optional[str] = None

class MeetingCreate(MeetingBase):
    VisitorIds: Optional[List[int]] = []

class MeetingResponse(MeetingBase):
    MeetingId: int
    CreatedAt: datetime
    Host: Optional[UserResponse] = None
    Room: Optional[RoomResponse] = None
    Attendees: Optional[List[MeetingAttendeeResponse]] = []

    class Config:
        from_attributes = True

# Check-in / Badge Request
class CheckInRequest(BaseModel):
    PassCode: str
    BadgeNumber: Optional[str] = None
    Remarks: Optional[str] = None

# Notification Schemas
class NotificationResponse(BaseModel):
    NotificationId: int
    UserId: int
    Title: str
    Message: str
    NotificationType: str
    IsRead: bool
    CreatedAt: datetime

    class Config:
        from_attributes = True
