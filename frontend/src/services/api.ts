import axios from 'axios';
import { Meeting, Visitor, Room, User, NotificationItem } from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
  }
  return fallback;
};

export const api = {
  // Initial DB Seed (runs seamlessly if backend is up)
  seedDb: async () => {
    try {
      const res = await axios.post(`${API_BASE}/seed`);
      return res.data;
    } catch {
      return null;
    }
  },

  // Dashboard stats
  getStats: async () => {
    try {
      const res = await axios.get(`${API_BASE}/dashboard/stats`);
      return res.data;
    } catch {
      return {
        total_meetings: 4,
        active_checked_in_visitors: 1,
        total_visitors: 3,
        total_rooms: 4,
        upcoming_meetings: 3,
      };
    }
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    try {
      const res = await axios.get(`${API_BASE}/users`);
      return res.data;
    } catch {
      return [
        {
          UserId: 1,
          FullName: 'Washi Mazumder',
          Email: 'washi@sage.com',
          Role: 'Admin',
          Department: 'Product Management',
          Designation: 'Lead Product Manager',
          AvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        },
        {
          UserId: 2,
          FullName: 'Barbara Gordon',
          Email: 'barbara@sage.com',
          Role: 'Employee',
          Department: 'Design & UI/UX',
          Designation: 'Senior Designer',
          AvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        },
        {
          UserId: 3,
          FullName: 'Sarah Connor',
          Email: 'sarah.reception@sage.com',
          Role: 'Receptionist',
          Department: 'Operations',
          Designation: 'Front Desk Lead',
          AvatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        },
      ];
    }
  },

  // Rooms
  getRooms: async (): Promise<Room[]> => {
    try {
      const res = await axios.get(`${API_BASE}/rooms`);
      return res.data;
    } catch {
      return [
        { RoomId: 1, RoomName: 'Zoom Innovation Lab', Location: 'Floor 3, East Wing', Capacity: 12, Amenities: '4K Display, Polycom Video Bar', IsAvailable: true },
        { RoomId: 2, RoomName: 'Boardroom 775', Location: '775 Rolling Green Rd, Level 4', Capacity: 20, Amenities: '4K Conference Setup, Smart Mic', IsAvailable: true },
        { RoomId: 3, RoomName: 'Creative UI Studio', Location: 'Floor 2, Creative Hub', Capacity: 8, Amenities: 'Interactive Touch Board, Dual Monitors', IsAvailable: true },
        { RoomId: 4, RoomName: 'Focus Room A', Location: 'Floor 1, West Wing', Capacity: 4, Amenities: 'Video Conferencing Pod', IsAvailable: true },
      ];
    }
  },

  createRoom: async (data: Omit<Room, 'RoomId'>) => {
    const res = await axios.post(`${API_BASE}/rooms`, data);
    return res.data;
  },

  // Visitors
  getVisitors: async (): Promise<Visitor[]> => {
    try {
      const res = await axios.get(`${API_BASE}/visitors`);
      return res.data;
    } catch {
      return [
        { VisitorId: 1, FullName: 'Michael Vance', Email: 'michael.vance@techcorp.com', Phone: '+1-555-0199', Company: 'TechCorp Solutions', GovtIdNumber: 'NID-98321045', Address: 'Silicon Plaza, Floor 5' },
        { VisitorId: 2, FullName: 'Elena Rostova', Email: 'elena@novadesign.io', Phone: '+1-555-0288', Company: 'Nova Design Co.', GovtIdNumber: 'NID-88219432', Address: 'Austin, TX' },
        { VisitorId: 3, FullName: 'David Kim', Email: 'david.k@vanguard.org', Phone: '+1-555-0377', Company: 'Vanguard Media', GovtIdNumber: 'NID-77218321', Address: 'Seattle, WA' },
      ];
    }
  },

  registerVisitor: async (data: Omit<Visitor, 'VisitorId'>) => {
    const res = await axios.post(`${API_BASE}/visitors`, data);
    return res.data;
  },

  updateVisitor: async (visitorId: number, data: Omit<Visitor, 'VisitorId'>) => {
    const res = await axios.put(`${API_BASE}/visitors/${visitorId}`, data);
    return res.data;
  },

  // Meetings
  getMeetings: async (): Promise<Meeting[]> => {
    try {
      const res = await axios.get(`${API_BASE}/meetings`);
      return res.data;
    } catch {
      const baseDate = new Date();
      return [
        {
          MeetingId: 1,
          Title: 'Marketing Strategy Meeting',
          Description: 'Quarterly roadmap sync and marketing review',
          HostId: 1,
          HostName: 'Washi Mazumder',
          HostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          RoomId: 1,
          RoomName: 'Zoom Innovation Lab',
          RoomLocation: 'Floor 3, East Wing',
          MeetingType: 'Meeting',
          StartTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 2).toISOString(),
          EndTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 3).toISOString(),
          Status: 'Scheduled',
          VideoCallUrl: 'https://zoom.us/j/984218321',
          Attendees: [
            {
              AttendeeId: 1,
              VisitorId: 1,
              VisitorName: 'Michael Vance',
              VisitorEmail: 'michael.vance@techcorp.com',
              VisitorCompany: 'TechCorp Solutions',
              PassCode: 'PASS-9821',
              Status: 'Approved',
              BadgeIssued: true,
              BadgeNumber: 'BDG-001',
            }
          ]
        },
        {
          MeetingId: 2,
          Title: 'Creative UI Workshop',
          Description: 'Design system alignment & component handoff session',
          HostId: 2,
          HostName: 'Barbara Gordon',
          HostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          RoomId: 2,
          RoomName: 'Boardroom 775',
          RoomLocation: '775 Rolling Green Rd.',
          MeetingType: 'Workshop',
          StartTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 26).toISOString(),
          EndTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 28).toISOString(),
          Status: 'Scheduled',
          VideoCallUrl: 'https://meet.google.com/abc-defg-hij',
          Attendees: [
            {
              AttendeeId: 2,
              VisitorId: 2,
              VisitorName: 'Elena Rostova',
              VisitorEmail: 'elena@novadesign.io',
              VisitorCompany: 'Nova Design Co.',
              PassCode: 'PASS-4412',
              Status: 'Invited',
              BadgeIssued: false,
            }
          ]
        },
        {
          MeetingId: 3,
          Title: 'National Independence Day',
          Description: 'Public holiday celebration',
          HostId: 1,
          HostName: 'System Admin',
          MeetingType: 'Holiday',
          StartTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), 5, 9, 0).toISOString(),
          EndTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), 5, 18, 0).toISOString(),
          Status: 'Scheduled',
        },
        {
          MeetingId: 4,
          Title: 'Annual Executive Keynote',
          Description: 'Keynote and investor update',
          HostId: 2,
          HostName: 'Barbara Gordon',
          RoomId: 2,
          RoomName: 'Boardroom 775',
          RoomLocation: '775 Rolling Green Rd.',
          MeetingType: 'Leave',
          StartTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), 6, 9, 0).toISOString(),
          EndTime: new Date(baseDate.getFullYear(), baseDate.getMonth(), 6, 17, 0).toISOString(),
          Status: 'Scheduled',
        }
      ];
    }
  },

  createMeeting: async (data: Omit<Meeting, 'MeetingId' | 'HostName' | 'HostAvatar' | 'RoomName' | 'RoomLocation' | 'Attendees'> & { VisitorIds?: number[] }) => {
    const res = await axios.post(`${API_BASE}/meetings`, data);
    return res.data;
  },

  updateMeeting: async (meetingId: number, data: Omit<Meeting, 'MeetingId' | 'HostName' | 'HostAvatar' | 'RoomName' | 'RoomLocation' | 'Attendees'> & { VisitorIds?: number[] }) => {
    const res = await axios.put(`${API_BASE}/meetings/${meetingId}`, data);
    return res.data;
  },

  deleteMeeting: async (meetingId: number) => {
    await axios.delete(`${API_BASE}/meetings/${meetingId}`);
  },

  // Check-In / Check-Out
  checkInVisitor: async (passCode: string, badgeNumber?: string, remarks?: string) => {
    const res = await axios.post(`${API_BASE}/reception/check-in`, {
      PassCode: passCode,
      BadgeNumber: badgeNumber,
      Remarks: remarks
    });
    return res.data;
  },

  checkOutVisitor: async (passCode: string) => {
    const res = await axios.post(`${API_BASE}/reception/check-out`, {
      PassCode: passCode
    });
    return res.data;
  },

  // Notifications
  getNotifications: async (userId: number = 1): Promise<NotificationItem[]> => {
    try {
      const res = await axios.get(`${API_BASE}/notifications?user_id=${userId}`);
      return res.data;
    } catch {
      return [
        {
          NotificationId: 1,
          UserId: 1,
          Title: 'Upcoming Meeting Alert',
          Message: 'Marketing Strategy Meeting will start in 2 hours in Zoom Innovation Lab.',
          NotificationType: 'MeetingInvite',
          IsRead: false,
          CreatedAt: new Date().toISOString()
        },
        {
          NotificationId: 2,
          UserId: 1,
          Title: 'Visitor Pre-Registration',
          Message: 'Michael Vance has registered and accepted your meeting invite.',
          NotificationType: 'VisitorArrival',
          IsRead: false,
          CreatedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
  },

  markNotificationRead: async (notifId: number) => {
    await axios.post(`${API_BASE}/notifications/${notifId}/read`);
  }
};
