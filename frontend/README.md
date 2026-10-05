# Office Visitor & Meeting Management System

## Complete Figma / UI Design Prompt

Design the complete frontend UI/UX for an **Office Visitor & Meeting Management System**.

The backend is already planned with:

- Node.js
- Express.js
- MongoDB
- Mongoose
- Better Auth
- Google Authentication
- REST API
- Role-based access control

The frontend should consume the backend REST APIs.

**Important:** Do not redesign or invent backend functionality. Build the UI around the existing backend modules, roles, workflows, and API structure.

This is an **office management SaaS dashboard**, so prioritize:

- Clean layout
- Professional appearance
- Excellent readability
- Easy navigation
- Fast interaction
- Accessibility
- Responsive design
- Reusable shadcn/ui components
- Consistent spacing
- Clear status indicators
- Simple data-heavy interfaces

A very high-end visual design is NOT mandatory. The priority is a **professional, usable, consistent and implementation-friendly design**.

---

# 1. Overall Design Direction

Create a modern enterprise SaaS interface.

Visual inspiration:

- Modern SaaS dashboard
- Office management software
- Visitor management system
- Meeting room management software
- shadcn/ui
- Linear-style spacing
- Notion-like clarity
- Vercel-like simplicity

Avoid:

- Excessive gradients
- Excessive glassmorphism
- Huge decorative illustrations
- Heavy animations
- Excessive shadows
- Too many colors
- Overly rounded interfaces
- Dashboard clutter

The interface should look professional enough for an actual office environment.

---

# 2. Primary Design Theme

Use a **light-first professional theme**.

Primary visual identity:

```text
Background:
#F8FAFC

Main Surface:
#FFFFFF

Secondary Surface:
#F1F5F9

Primary:
#2563EB

Primary Hover:
#1D4ED8

Primary Soft:
#EFF6FF

Text Primary:
#0F172A

Text Secondary:
#475569

Text Muted:
#64748B

Border:
#E2E8F0

Success:
#16A34A

Success Background:
#F0FDF4

Warning:
#D97706

Warning Background:
#FFFBEB

Danger:
#DC2626

Danger Background:
#FEF2F2

Info:
#0284C7

Info Background:
#F0F9FF
```

Do not use all colors simultaneously.

Blue should be the main brand color.

Status colors should only communicate status.

---

# 3. Dark Mode

Support dark mode because shadcn/ui supports theme variables naturally.

Dark mode should use:

```text
Background:
#020617

Surface:
#0F172A

Secondary Surface:
#1E293B

Text Primary:
#F8FAFC

Text Secondary:
#CBD5E1

Border:
#334155

Primary:
#3B82F6
```

Do not simply invert every color.

Cards, tables, dialogs and forms should remain visually separated in dark mode.

---

# 4. Typography

Use:

```text
Font:
Inter
```

Alternative:

```text
Geist
```

Typography hierarchy:

```text
Page Title:
28px / 32px / 600

Section Heading:
20px / 28px / 600

Card Heading:
16px / 24px / 600

Body:
14px / 20px / 400

Small:
13px / 18px / 400

Caption:
12px / 16px / 400
```

Do not use excessively large headings inside dashboard screens.

---

# 5. Spacing System

Use an 8px spacing system.

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Most dashboard spacing should use:

```text
16px
24px
32px
```

---

# 6. Border Radius

Use moderate rounding.

```text
Small:
6px

Default:
8px

Cards:
10px

Large Dialog:
12px
```

Avoid extremely rounded cards.

Buttons can use:

```text
8px
```

---

# 7. Shadow System

Keep shadows subtle.

Default card:

```text
0 1px 2px rgba(0,0,0,0.04)
```

Elevated:

```text
0 4px 12px rgba(0,0,0,0.08)
```

Dialogs:

```text
0 20px 40px rgba(0,0,0,0.12)
```

Do not make every card heavily shadowed.

---

# 8. shadcn/ui Component Strategy

Use shadcn/ui wherever possible.

Required components:

```text
Button
Card
Badge
Avatar
Input
Textarea
Label
Select
Combobox
Checkbox
Radio Group
Switch
Dialog
Alert Dialog
Sheet
Dropdown Menu
Popover
Tooltip
Tabs
Accordion
Calendar
Date Picker
Table
Pagination
Breadcrumb
Separator
Skeleton
Alert
Toast / Sonner
Command
Progress
Scroll Area
Navigation Menu
Sidebar
```

Do NOT recreate components manually if an appropriate shadcn component already exists.

---

# 9. Button Design System

## Primary Button

Use for the main action.

```text
Background:
#2563EB

Text:
#FFFFFF

Hover:
#1D4ED8
```

Examples:

```text
Create Visitor
Create Meeting
Schedule Meeting
Check In
Save Changes
Generate Pass
```

---

## Secondary Button

```text
Background:
#FFFFFF

Border:
#E2E8F0

Text:
#0F172A
```

Examples:

```text
Cancel
View Details
Filter
Export
```

---

## Destructive Button

```text
Background:
#DC2626

Text:
#FFFFFF
```

Use only for:

```text
Delete
Revoke
Deactivate
Cancel Meeting
```

For dangerous actions use `AlertDialog`.

---

## Ghost Button

Use for:

```text
Table actions
Icon actions
Navigation actions
Secondary controls
```

---

## Icon Button

Use shadcn `Button` with:

```text
size="icon"
```

Examples:

```text
Edit
Delete
More
Notification
Search
Filter
```

Always provide a tooltip for unfamiliar icon-only actions.

---

# 10. Status Badge System

Use shadcn `Badge`.

### Visitor

```text
Expected      → Blue
Checked In    → Green
Checked Out   → Gray
Cancelled     → Red
No Show       → Orange
```

### Appointment

```text
Pending       → Yellow
Approved      → Green
Rejected      → Red
Cancelled     → Gray
Completed     → Green
No Show       → Orange
```

### Meeting

```text
Scheduled     → Blue
Ongoing       → Green
Completed     → Gray
Cancelled     → Red
```

### Room

```text
Available     → Green
Maintenance   → Orange
Inactive      → Gray
```

Do not use text-only status labels. Use badges consistently.

---

# 11. Global Application Layout

Desktop layout:

```text
┌─────────────────────────────────────────────────────────┐
│ Top Header                                              │
│ Search | Notifications | User                           │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│ Sidebar      │ Main Content                             │
│              │                                          │
│ Dashboard    │ Breadcrumb                               │
│ Visitors     │ Page Header                              │
│ Appointments │                                          │
│ Meetings     │ Content                                  │
│ Rooms        │                                          │
│ Reports      │                                          │
│ Notifications│                                          │
│              │                                          │
│ Settings     │                                          │
└──────────────┴──────────────────────────────────────────┘
```

Use shadcn `Sidebar`.

---

# 12. Sidebar

Navigation:

```text
Dashboard

Visitor Management
  Visitors
  Appointments
  Active Visitors

Meeting Management
  Meetings
  Meeting Rooms

Notifications

Reports

Administration
  Users
  Departments
  Audit Logs

Settings
```

Navigation should be role-aware.

For example:

Employee should not see:

```text
User Management
Audit Logs
System Administration
```

unless permitted by backend role/permission.

---

# 13. Header

Header should contain:

Left:

```text
Mobile Menu
Breadcrumb / Page Context
```

Right:

```text
Search
Notifications
Theme Toggle
User Avatar
User Dropdown
```

User dropdown:

```text
Profile
Settings
Logout
```

---

# 14. Dashboard Design

Create role-specific dashboards.

---

# 15. Admin Dashboard

Top KPI cards:

```text
Total Visitors
Today's Visits
Active Visitors
Today's Meetings
```

Second row:

```text
Visitor Activity
Meeting Activity
```

Third row:

```text
Recent Visitors
Upcoming Meetings
```

Fourth row:

```text
Room Utilization
Recent System Activity
```

Use shadcn:

```text
Card
Badge
Table
Progress
Tabs
```

Keep charts simple.

Possible charts:

```text
Visitors per Day
Meetings per Day
Room Usage
Visit Type Distribution
```

Do not create unnecessarily complex charts.

---

# 16. Reception Dashboard

Focus on daily operational work.

Top:

```text
Today's Expected Visitors
Currently Checked In
Today's Meetings
Walk-in Visitors
```

Main section:

```text
Expected Visitors Today
```

Each row:

```text
Visitor
Host
Purpose
Appointment Time
Status
Action
```

Actions:

```text
View
Check In
```

Secondary section:

```text
Active Visitors
```

Actions:

```text
View
Check Out
```

Large primary action:

```text
+ Register Walk-in Visitor
```

---

# 17. Security Dashboard

Focus on verification.

Cards:

```text
Active Visitors
Today's Visitors
Expected Visitors
Active Passes
```

Main interface:

```text
Search Visitor Pass
```

Large search field:

```text
Enter pass number / scan QR
```

Result card:

```text
Visitor Photo
Visitor Name
Host
Purpose
Check-in Time
Pass Status

[ Verify ]
```

Also display:

```text
Currently Checked In
```

---

# 18. Employee Dashboard

Employee dashboard should focus on meetings and visitors.

Cards:

```text
Today's Meetings
Upcoming Meetings
Expected Visitors
Visitors Currently Waiting
```

Main:

```text
Today's Schedule
```

Meeting card:

```text
Meeting Title
Time
Room
Attendees
Status
```

Upcoming visitors:

```text
Visitor
Appointment
Purpose
Arrival Status
```

Primary actions:

```text
Schedule Meeting
```

---

# 19. Management Dashboard

Focus on analytics.

Cards:

```text
Total Visitors
Monthly Visits
Meetings
Room Utilization
```

Charts:

```text
Visitor Trends
Meeting Trends
Room Utilization
Visit Type
```

Reports shortcuts:

```text
Visitor Report
Meeting Report
Room Report
History
```

---

# 20. Visitor Management

Page:

```text
Visitors
```

Top area:

```text
Visitors

[ Search visitors... ] [ Filter ] [ + Register Visitor ]
```

Table:

```text
Visitor
Organization
Phone
Email
Last Visit
Status
Actions
```

Actions:

```text
View
Edit
Delete
History
```

Use shadcn `Table`.

---

# 21. Visitor Profile

Create a detailed visitor page.

Header:

```text
Visitor Profile

Avatar / Photo
Full Name
Organization
Phone
Email
```

Tabs:

```text
Overview
Visit History
Appointments
```

Overview:

```text
Contact Information
Identity Information
Emergency Contact
```

Visit History table:

```text
Date
Purpose
Host
Visit Type
Check-in
Check-out
Status
```

---

# 22. Register Visitor

Use a shadcn form.

Fields:

```text
Full Name *
Email
Phone *
Organization
Address

Identity Type
Identity Number

Photo

Emergency Contact
```

Actions:

```text
Cancel
Register Visitor
```

Use proper form validation.

Show inline validation errors.

---

# 23. Appointment Management

Page header:

```text
Appointments

[ Search ]
[ Date ]
[ Status ]
[ Host ]
[ + New Appointment ]
```

Table:

```text
Visitor
Host
Purpose
Date
Time
Status
Actions
```

Appointment details dialog/page:

```text
Visitor Information
Host Employee
Purpose
Meeting
Date
Start Time
End Time
Status
Notes
```

Actions depending on role:

```text
Approve
Reject
Cancel
Edit
```

---

# 24. Create Appointment

Form:

```text
Select Visitor
Select Host Employee
Purpose
Date
Start Time
End Time
Meeting
Notes
```

Show a scheduling summary on the right side on desktop.

Example:

```text
Appointment Summary

Visitor:
John Doe

Host:
Nirob Sarker

Date:
October 12, 2026

Time:
10:00 AM - 11:00 AM
```

Mobile should stack this below the form.

---

# 25. Meeting Management

Page:

```text
Meetings
```

Top:

```text
Meetings

[ Search ]
[ Date ]
[ Status ]
[ Room ]

[ + Schedule Meeting ]
```

Table:

```text
Meeting
Organizer
Room
Date
Time
Status
Actions
```

---

# 26. Meeting Calendar

Create a calendar interface using shadcn-compatible calendar/date components.

Views:

```text
Month
Week
Day
```

Meeting blocks should display:

```text
Meeting title
Time
Room
```

Status should be visually distinguishable.

Do not make the calendar overly colorful.

---

# 27. Schedule Meeting

Form:

```text
Meeting Title
Description

Room
Date
Start Time
End Time

Attendees
```

Important UX:

When selecting a room and time, call:

```http
GET /api/v1/meeting-rooms/availability
```

Display:

```text
Available
```

or

```text
Not Available
```

If unavailable:

```text
This room is already booked for the selected time.
```

Disable submission when conflict is confirmed.

---

# 28. Meeting Room Management

Page:

```text
Meeting Rooms

[ Search ]
[ Status ]
[ + Add Room ]
```

Use cards or a compact table.

Room card:

```text
Conference Room A

Capacity:
12

Location:
2nd Floor

Facilities:
Projector
Whiteboard
Video Conference

Status:
Available

[ View ]
[ Edit ]
```

---

# 29. Room Availability

Create a simple availability screen.

Controls:

```text
Date
Start Time
End Time
Capacity
```

Results:

```text
Available Rooms
```

Room cards:

```text
Room Name
Capacity
Facilities
Location

[ Select Room ]
```

---

# 30. Active Visitors

This is an important operational screen.

Header:

```text
Active Visitors
```

Show:

```text
Visitor
Host
Purpose
Check-in Time
Pass
Duration
Action
```

Action:

```text
Check Out
```

Use a green status indicator for currently checked-in visitors.

---

# 31. Check-in UI

Create a check-in dialog.

Step 1:

```text
Find Appointment
```

Step 2:

```text
Verify Visitor
```

Step 3:

```text
Confirm Check-in
```

Confirmation:

```text
Visitor:
John Doe

Host:
Nirob Sarker

Purpose:
Business Meeting

Appointment:
10:00 AM

[ Confirm Check-in ]
```

After success:

```text
Visitor checked in successfully.
Employee has been notified.
```

---

# 32. Walk-in Visitor UI

Create a dedicated workflow.

```text
Register Walk-in Visitor
```

First:

```text
Search Existing Visitor
```

If found:

```text
Visitor Found
[ Continue ]
```

If not found:

```text
[ Register New Visitor ]
```

Then:

```text
Host Employee
Purpose
Expected Duration
Notes
```

Then:

```text
[ Check In Visitor ]
```

---

# 33. Visitor Pass

After successful check-in:

```text
Visitor Pass
```

Display:

```text
Company Logo

VISITOR PASS

Visitor:
John Doe

Host:
Nirob Sarker

Purpose:
Business Meeting

Check-in:
10:04 AM

Expires:
12:00 PM

Pass ID:
VP-2026-0012

QR Code
```

Actions:

```text
Print
Download
Revoke
```

---

# 34. Notifications

Notification page:

```text
Notifications

[ All ] [ Unread ]
```

Notification item:

```text
Visitor Arrived
John Doe has arrived to meet you.

10 minutes ago
```

Types:

```text
Visitor Arrived
Meeting Created
Meeting Updated
Meeting Cancelled
Appointment Approved
Appointment Rejected
System
```

Use icons + status, but keep the design simple.

---

# 35. Reports

Reports page:

```text
Reports
```

Cards:

```text
Visitor Reports
Meeting Reports
Room Utilization
Active Visitors
Visitor History
Meeting History
```

Each report should have:

```text
Date Range
Filters
Search
Export
```

Tables should support:

```text
Pagination
Sorting
Filtering
```

---

# 36. User Management

Admin-only.

Page:

```text
Users

[ Search ]
[ Role ]
[ Department ]
[ Status ]
[ + Add User ]
```

Table:

```text
User
Employee ID
Department
Role
Status
Last Login
Actions
```

User form:

```text
Name
Email
Phone
Employee ID
Department
Role
Status
```

Do not allow users to manipulate Better Auth's internal session/account data directly through normal CRUD.

---

# 37. Department Management

Table:

```text
Department
Code
Head
Members
Status
Actions
```

Actions:

```text
View
Edit
Delete
```

---

# 38. Audit Logs

Admin-only.

Table:

```text
Date
User
Action
Module
Description
IP
```

Filters:

```text
User
Module
Action
Date Range
```

Do not make audit logs editable.

They are read-only records.

---

# 39. Settings

Settings sections:

```text
Profile
Account
Appearance
Notifications
```

Appearance:

```text
Light
Dark
System
```

Notifications:

```text
Visitor Arrival
Meeting Updates
Appointment Updates
```

---

# 40. Empty States

Every list/table must have a useful empty state.

Example:

```text
No visitors found.

Register your first visitor to get started.

[ Register Visitor ]
```

For filtered results:

```text
No visitors match your current filters.

Try changing your search or filters.
```

---

# 41. Loading States

Use shadcn skeletons.

Never show a blank page while loading.

Examples:

```text
Dashboard Card Skeleton
Table Row Skeleton
Profile Skeleton
Calendar Skeleton
```

---

# 42. Error States

Use shadcn Alert / Sonner.

Example:

```text
Unable to load visitors.

Please try again.

[ Retry ]
```

API validation errors should appear beside the related form field.

---

# 43. Confirmation Dialogs

Use `AlertDialog`.

For delete:

```text
Delete Visitor?

This action cannot be undone.

[ Cancel ] [ Delete ]
```

For meeting cancellation:

```text
Cancel Meeting?

This meeting will be cancelled for all attendees.

[ Keep Meeting ] [ Cancel Meeting ]
```

For visitor checkout:

```text
Check out visitor?

Visitor: John Doe

[ Cancel ] [ Check Out ]
```

---

# 44. Search

Use shadcn `Command` where appropriate.

Global search can eventually support:

```text
Visitors
Meetings
Appointments
Rooms
Employees
```

Module-specific search should remain independent.

For visitor search:

```text
Search name, phone or organization...
```

For meetings:

```text
Search meeting title or organizer...
```

---

# 45. Filtering

Use:

```text
Popover
Select
Date Picker
Checkbox
Command
```

Example visitor filters:

```text
Status
Visit Type
Date
Host
Organization
```

Filters should collapse into a sheet on mobile.

---

# 46. Pagination

Tables should use:

```text
Previous
Page Number
Next
```

Display:

```text
Showing 1–10 of 120 visitors
```

Pagination must use backend API query parameters.

Example:

```http
GET /api/v1/visitors?page=1&limit=10
```

---

# 47. API Integration Architecture

The UI must NOT directly put API calls inside every component.

Create a centralized API layer.

Recommended:

```text
src/
├── lib/
│   ├── api-client.ts
│   └── api-error.ts
│
├── services/
│   ├── auth.service.ts
│   ├── visitor.service.ts
│   ├── appointment.service.ts
│   ├── meeting.service.ts
│   ├── room.service.ts
│   ├── visit.service.ts
│   ├── notification.service.ts
│   ├── report.service.ts
│   └── user.service.ts
```

Example:

```ts
visitorService.getVisitors();
visitorService.getVisitor(id);
visitorService.createVisitor(data);
visitorService.updateVisitor(id, data);
visitorService.deleteVisitor(id);
```

Do not call:

```ts
fetch(...)
```

directly from every page/component.

---

# 48. API State Management

Use a server-state library such as:

```text
TanStack Query
```

Recommended pattern:

```text
Component
   |
   v
TanStack Query
   |
   v
Service
   |
   v
API Client
   |
   v
Express API
```

Example:

```text
useVisitors()
useVisitor(id)
useCreateVisitor()
useCheckInVisitor()
useCheckOutVisitor()
useMeetings()
useMeetingRooms()
```

---

# 49. API Integration Examples

Visitor list:

```http
GET /api/v1/visitors?page=1&limit=10
```

Create visitor:

```http
POST /api/v1/visitors
```

Check-in:

```http
POST /api/v1/visits/:id/check-in
```

Check-out:

```http
POST /api/v1/visits/:id/check-out
```

Meeting availability:

```http
GET /api/v1/meeting-rooms/availability
```

Notifications:

```http
GET /api/v1/notifications/unread
```

Reports:

```http
GET /api/v1/reports/visitors
```

---

# 50. API Loading / Success / Error UX

Every API-driven screen must support:

```text
Loading
Success
Empty
Error
Retry
```

Example:

```text
Loading
   ↓
Success → Data
   ↓
Empty → Empty State

OR

Error → Error State → Retry
```

After mutations:

```text
API Success
   ↓
Toast
   ↓
Invalidate Query
   ↓
Refresh affected data
```

Example:

```text
Create Visitor
     ↓
POST /visitors
     ↓
Success
     ↓
Toast: Visitor created
     ↓
Invalidate visitors query
     ↓
Updated visitor table
```

---

# 51. Better Auth UI Integration

Authentication screens should include:

```text
Login
Continue with Google
Forgot Password (if enabled)
```

Do not design a custom OAuth flow.

Google button:

```text
[ Google Icon ] Continue with Google
```

After authentication:

```text
Better Auth Session
       ↓
Application User
       ↓
Role
       ↓
Dashboard
```

If a user authenticates successfully but has no valid application role/profile:

```text
Account setup required.
Please contact an administrator.
```

---

# 52. Responsive Design

The entire application must be responsive.

Use these breakpoints:

```text
Mobile:
< 640px

Tablet:
640px – 1023px

Desktop:
1024px – 1279px

Large Desktop:
1280px+
```

---

# 53. Mobile Layout

On mobile:

Desktop sidebar becomes:

```text
Sheet / Drawer
```

Header:

```text
☰
Page Title
Notifications
Avatar
```

Tables should not simply overflow horizontally wherever possible.

Convert complex tables into cards when appropriate.

Example:

Desktop:

```text
Visitor | Host | Time | Status | Action
```

Mobile:

```text
┌───────────────────────┐
│ John Doe              │
│ Business Meeting      │
│                       │
│ Host: Nirob Sarker    │
│ 10:00 AM              │
│ Status: Checked In    │
│                       │
│ [ View ] [ Check Out ]│
└───────────────────────┘
```

---

# 54. Mobile Forms

Forms should become single-column.

Desktop:

```text
Name          Email
Phone         Organization
Identity Type Identity Number
```

Mobile:

```text
Name

Email

Phone

Organization

Identity Type

Identity Number
```

Buttons should become full-width where appropriate.

---

# 55. Tablet Design

Tablet should use:

```text
Collapsible Sidebar
2-column dashboard cards
Responsive forms
Compact tables
```

Do not force desktop layouts onto tablets.

---

# 56. Desktop Design

Desktop should use:

```text
Sidebar
Top Header
12-column content grid
2/3-column forms where appropriate
Data tables
Charts
```

Maximum content width:

```text
1440px
```

Center the main content on very large screens.

---

# 57. Responsive Tables

Desktop:

```text
Full table
```

Tablet:

```text
Reduced columns
Horizontal scroll only when necessary
```

Mobile:

```text
Card/list representation
```

Never allow important actions to become inaccessible.

---

# 58. Responsive Dialogs

Desktop:

```text
Dialog:
500–650px
```

Mobile:

Use:

```text
Sheet
```

or full-width dialog.

Forms should be easy to use with touch.

---

# 59. Accessibility

Follow basic accessibility practices.

Required:

- Proper labels.
- Keyboard navigation.
- Visible focus states.
- Accessible dialogs.
- Tooltips for icon-only buttons.
- Sufficient color contrast.
- Do not communicate status through color alone.
- Buttons must have clear labels.
- Form errors must be readable.
- Tables must have meaningful headers.

---

# 60. Design Tokens

Create Figma variables/design tokens for:

```text
Colors
Typography
Spacing
Radius
Shadows
Border
Status Colors
```

Example:

```text
color.background
color.surface
color.surface.secondary
color.primary
color.primary.hover
color.text
color.text.secondary
color.border
color.success
color.warning
color.danger
```

This makes the design easy to translate into shadcn CSS variables.

---

# 61. Figma Component Library

Create reusable components:

```text
Button
IconButton
Input
Select
SearchInput
DatePicker
Badge
Avatar
Card
StatCard
DataTable
Pagination
EmptyState
ErrorState
LoadingSkeleton
ConfirmDialog
FormDialog
PageHeader
Breadcrumb
Sidebar
Topbar
NotificationItem
VisitorCard
MeetingCard
RoomCard
UserCard
StatusBadge
```

Create variants for:

```text
Default
Hover
Focus
Active
Disabled
Loading
Error
Success
```

---

# 62. Page-Level Design System

Every page should follow:

```text
Breadcrumb
    ↓
Page Title
    ↓
Description
    ↓
Primary Action / Filters
    ↓
Main Content
```

Example:

```text
Dashboard

Welcome back, Nirob.

[ KPI Cards ]

[ Visitor Activity ] [ Meeting Activity ]

[ Recent Visitors ]

[ Upcoming Meetings ]
```

---

# 63. Figma Screen List

Create the following screens.

## Authentication

```text
Login
Google Login State
Authentication Error
Account Setup
```

## Dashboard

```text
Admin Dashboard
Reception Dashboard
Security Dashboard
Employee Dashboard
Management Dashboard
```

## Visitors

```text
Visitor List
Visitor Details
Register Visitor
Edit Visitor
Visitor History
Walk-in Registration
```

## Appointments

```text
Appointment List
Appointment Details
Create Appointment
Edit Appointment
Appointment Approval
```

## Meetings

```text
Meeting List
Meeting Details
Schedule Meeting
Edit Meeting
Meeting Calendar
Meeting Cancellation
```

## Rooms

```text
Room List
Room Details
Add Room
Edit Room
Room Availability
```

## Visits

```text
Active Visitors
Check-in Dialog
Check-out Dialog
Visit Details
Visitor Pass
```

## Notifications

```text
Notification List
Unread Notifications
```

## Reports

```text
Reports Dashboard
Visitor Report
Meeting Report
Room Utilization
Visitor History
Meeting History
```

## Administration

```text
User List
Create User
Edit User
Department List
Create Department
Edit Department
Audit Logs
```

## Settings

```text
Profile
Account
Appearance
Notifications
```

## System States

```text
Loading
Empty
No Search Results
404
403 Forbidden
500 Server Error
Network Error
```

---

# 64. Important Interaction Rules

### Delete

Always confirm.

### Check-in

Show visitor details before confirmation.

### Check-out

Show visitor + duration before confirmation.

### Cancel Meeting

Show warning.

### Room Conflict

Show immediate conflict state.

### Form Submit

Show loading state:

```text
Saving...
```

Disable duplicate submission.

### API Failure

Show:

```text
Something went wrong.
Please try again.
```

---

# 65. No Frontend Business Logic Duplication

The frontend should not independently implement business rules that belong to the backend.

For example:

The frontend may show:

```text
Room appears available
```

but the backend must be the final authority.

Before creating the meeting:

```text
Frontend
   ↓
POST /meetings
   ↓
Backend checks conflict
   ↓
Success OR 409 Conflict
```

If backend returns:

```text
409 ROOM_CONFLICT
```

the UI must display:

```text
This room is no longer available for the selected time.
Please choose another room or time.
```

---

# 66. API Error Mapping

Map backend errors to friendly UI messages.

Example:

```text
401
→ Please sign in again.

403
→ You do not have permission to perform this action.

404
→ The requested record could not be found.

409 ROOM_CONFLICT
→ This meeting room is already booked.

422
→ Please correct the highlighted fields.

500
→ Something went wrong on the server.
```

Never expose raw backend stack traces to users.

---

# 67. Final AI/Figma Instruction

Build this entire application as a **professional office visitor and meeting management SaaS dashboard**.

Use:

```text
shadcn/ui
Tailwind CSS
Inter / Geist
Lucide Icons
Responsive layouts
Accessible components
Clean cards
Professional tables
Subtle shadows
Moderate border radius
Blue primary brand
Neutral backgrounds
Semantic status colors
```

The design should be:

```text
Professional
Minimal
Clean
Modern
Accessible
Responsive
Implementation-friendly
```

Do not make it visually complicated.

Do not introduce unnecessary sections or features that are not part of the backend/project requirements.

Do not invent new business modules.

Use reusable components everywhere.

Every screen must be designed with:

```text
Loading
Success
Empty
Error
Disabled
Mobile
Tablet
Desktop
```

in mind.

The final Figma design should be directly implementable using shadcn/ui and Tailwind CSS.

Most importantly, the UI must map cleanly to the existing backend API architecture:

```text
Better Auth
    ↓
Express API
    ↓
Role Authorization
    ↓
Services
    ↓
MongoDB
```

and the frontend should consume:

```text
/api/v1/auth
/api/v1/users
/api/v1/departments
/api/v1/visitors
/api/v1/appointments
/api/v1/meetings
/api/v1/meeting-rooms
/api/v1/visits
/api/v1/notifications
/api/v1/visitor-passes
/api/v1/dashboard
/api/v1/reports
```

Do not change the backend architecture to fit the UI.

Instead, design the UI around the backend architecture.
