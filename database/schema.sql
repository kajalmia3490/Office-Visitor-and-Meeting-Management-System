-- =========================================================================
-- Office Visitor and Meeting Management System (OVMS) - Database Schema
-- Target RDBMS: Microsoft SQL Server (MS SQL)
-- =========================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'OfficeVisitorDB')
BEGIN
    CREATE DATABASE OfficeVisitorDB;
END
GO

USE OfficeVisitorDB;
GO

IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL DROP TABLE dbo.Notifications;
IF OBJECT_ID('dbo.MeetingAttendees', 'U') IS NOT NULL DROP TABLE dbo.MeetingAttendees;
IF OBJECT_ID('dbo.Meetings', 'U') IS NOT NULL DROP TABLE dbo.Meetings;
IF OBJECT_ID('dbo.Visitors', 'U') IS NOT NULL DROP TABLE dbo.Visitors;
IF OBJECT_ID('dbo.Rooms', 'U') IS NOT NULL DROP TABLE dbo.Rooms;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

CREATE TABLE dbo.Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(150) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'Employee', -- 'Admin', 'Employee', 'Receptionist'
    Department NVARCHAR(100) NULL,
    Designation NVARCHAR(100) NULL,
    Phone NVARCHAR(50) NULL,
    AvatarUrl NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.Rooms (
    RoomId INT IDENTITY(1,1) PRIMARY KEY,
    RoomName NVARCHAR(100) NOT NULL,
    Location NVARCHAR(150) NOT NULL,
    Capacity INT NOT NULL DEFAULT 6,
    Amenities NVARCHAR(300) NULL,
    IsAvailable BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.Visitors (
    VisitorId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(150) NOT NULL,
    Phone NVARCHAR(50) NOT NULL,
    Company NVARCHAR(150) NULL,
    GovtIdNumber NVARCHAR(100) NULL,
    Address NVARCHAR(250) NULL,
    PhotoUrl NVARCHAR(500) NULL,
    QrCodeKey NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.Meetings (
    MeetingId INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    HostId INT NOT NULL,
    RoomId INT NULL,
    MeetingType NVARCHAR(50) NOT NULL DEFAULT 'Meeting', -- 'Meeting', 'Workshop', 'Holiday', 'Leave', 'Event'
    StartTime DATETIME2 NOT NULL,
    EndTime DATETIME2 NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Scheduled', -- 'Scheduled', 'In-Progress', 'Completed', 'Cancelled'
    VideoCallUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Meetings_Host FOREIGN KEY (HostId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE,
    CONSTRAINT FK_Meetings_Room FOREIGN KEY (RoomId) REFERENCES dbo.Rooms(RoomId) ON DELETE SET NULL
);
GO

CREATE TABLE dbo.MeetingAttendees (
    AttendeeId INT IDENTITY(1,1) PRIMARY KEY,
    MeetingId INT NOT NULL,
    VisitorId INT NOT NULL,
    PassCode NVARCHAR(50) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Invited', -- 'Invited', 'Approved', 'Checked-In', 'Checked-Out', 'No-Show'
    CheckInTime DATETIME2 NULL,
    CheckOutTime DATETIME2 NULL,
    BadgeIssued BIT NOT NULL DEFAULT 0,
    BadgeNumber NVARCHAR(50) NULL,
    Remarks NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Attendees_Meeting FOREIGN KEY (MeetingId) REFERENCES dbo.Meetings(MeetingId) ON DELETE CASCADE,
    CONSTRAINT FK_Attendees_Visitor FOREIGN KEY (VisitorId) REFERENCES dbo.Visitors(VisitorId) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.Notifications (
    NotificationId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    NotificationType NVARCHAR(50) NOT NULL DEFAULT 'System',
    IsRead BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Notifications_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);
GO

-- Seed Demo Data
INSERT INTO dbo.Users (FullName, Email, PasswordHash, Role, Department, Designation, Phone, AvatarUrl)
VALUES 
('Washi Mazumder', 'washi@sage.com', 'hashed_pass_123', 'Admin', 'Product Management', 'Lead Product Manager', '+8801700000001', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
('Barbara Gordon', 'barbara@sage.com', 'hashed_pass_123', 'Employee', 'Design & UI/UX', 'Senior Designer', '+8801700000002', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
('Sarah Connor', 'sarah.reception@sage.com', 'hashed_pass_123', 'Receptionist', 'Operations', 'Front Desk Lead', '+8801700000003', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
('Alex Mercer', 'alex@sage.com', 'hashed_pass_123', 'Employee', 'Engineering', 'Tech Lead', '+8801700000004', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');

INSERT INTO dbo.Rooms (RoomName, Location, Capacity, Amenities)
VALUES 
('Zoom Innovation Lab', 'Floor 3, East Wing', 12, '4K Display, Polycom Video Bar, Dual Whiteboard'),
('Boardroom 775', '775 Rolling Green Rd, Level 4', 20, '4K Conference Setup, Smart Mic, Presentation Hub'),
('Creative UI Studio', 'Floor 2, Creative Hub', 8, 'Interactive Touch Board, Dual Monitors'),
('Focus Room A', 'Floor 1, West Wing', 4, 'Video Conferencing Pod, Soundproof Glass');

INSERT INTO dbo.Visitors (FullName, Email, Phone, Company, GovtIdNumber, Address)
VALUES 
('Michael Vance', 'michael.vance@techcorp.com', '+1-555-0199', 'TechCorp Solutions', 'NID-98321045', 'Silicon Plaza, Floor 5'),
('Elena Rostova', 'elena@novadesign.io', '+1-555-0288', 'Nova Design Co.', 'NID-88219432', 'Austin, TX'),
('David Kim', 'david.k@vanguard.org', '+1-555-0377', 'Vanguard Media', 'NID-77218321', 'Seattle, WA');

INSERT INTO dbo.Meetings (Title, Description, HostId, RoomId, MeetingType, StartTime, EndTime, Status, VideoCallUrl)
VALUES 
('Marketing Strategy Meeting', 'Quarterly roadmap sync and marketing review', 1, 1, 'Meeting', DATEADD(HOUR, 2, GETDATE()), DATEADD(HOUR, 3, GETDATE()), 'Scheduled', 'https://zoom.us/j/984218321'),
('Creative UI Workshop', 'Design system alignment & component handoff session', 2, 2, 'Workshop', DATEADD(DAY, 1, GETDATE()), DATEADD(DAY, 1, DATEADD(HOUR, 2, GETDATE())), 'Scheduled', 'https://meet.google.com/abc-defg-hij'),
('Independence Day Observance', 'Office closed for national holiday', 1, NULL, 'Holiday', '2026-10-05 09:00:00', '2026-10-05 18:00:00', 'Scheduled', NULL),
('Annual Product Keynote Prep', 'Review deck and demo walkthrough with executive guests', 1, 2, 'Event', DATEADD(DAY, 2, GETDATE()), DATEADD(DAY, 2, DATEADD(HOUR, 3, GETDATE())), 'Scheduled', NULL);

INSERT INTO dbo.MeetingAttendees (MeetingId, VisitorId, PassCode, Status, BadgeIssued, BadgeNumber)
VALUES 
(1, 1, 'PASS-9821', 'Approved', 1, 'BDG-001'),
(2, 2, 'PASS-4412', 'Invited', 0, NULL),
(4, 3, 'PASS-7731', 'Approved', 1, 'BDG-003');

INSERT INTO dbo.Notifications (UserId, Title, Message, NotificationType, IsRead)
VALUES 
(1, 'Upcoming Meeting Alert', 'Marketing Strategy Meeting will start in 2 hours in Zoom Innovation Lab.', 'MeetingInvite', 0),
(1, 'Visitor Pre-Registration', 'Michael Vance has registered and accepted your meeting invite.', 'VisitorArrival', 0),
(2, 'Room Booking Confirmed', 'Boardroom 775 booked for Creative UI Workshop.', 'System', 1);
GO
