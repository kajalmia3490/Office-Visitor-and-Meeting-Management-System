export interface User {
  UserId: number;
  FullName: string;
  Email: string;
  Role: 'Admin' | 'Employee' | 'Receptionist';
  Department?: string;
  Designation?: string;
  Phone?: string;
  AvatarUrl?: string;
}

export interface Room {
  RoomId: number;
  RoomName: string;
  Location: string;
  Capacity: number;
  Amenities?: string;
  IsAvailable: boolean;
}

export interface Visitor {
  VisitorId: number;
  FullName: string;
  Email: string;
  Phone: string;
  Company?: string;
  GovtIdNumber?: string;
  Address?: string;
  PhotoUrl?: string;
}

export interface MeetingAttendee {
  AttendeeId: number;
  VisitorId: number;
  VisitorName?: string;
  VisitorEmail?: string;
  VisitorCompany?: string;
  PassCode: string;
  Status: 'Invited' | 'Approved' | 'Checked-In' | 'Checked-Out' | 'No-Show';
  BadgeIssued: boolean;
  BadgeNumber?: string;
  CheckInTime?: string;
  CheckOutTime?: string;
}

export interface Meeting {
  MeetingId: number;
  Title: string;
  Description?: string;
  HostId: number;
  HostName?: string;
  HostAvatar?: string;
  RoomId?: number;
  RoomName?: string;
  RoomLocation?: string;
  MeetingType: 'Meeting' | 'Workshop' | 'Holiday' | 'Leave' | 'Event';
  StartTime: string;
  EndTime: string;
  Status: 'Scheduled' | 'In-Progress' | 'Completed' | 'Cancelled';
  VideoCallUrl?: string;
  Attendees?: MeetingAttendee[];
}

export interface NotificationItem {
  NotificationId: number;
  UserId: number;
  Title: string;
  Message: string;
  NotificationType: 'MeetingInvite' | 'VisitorArrival' | 'System' | 'CheckInAlert';
  IsRead: boolean;
  CreatedAt: string;
}
