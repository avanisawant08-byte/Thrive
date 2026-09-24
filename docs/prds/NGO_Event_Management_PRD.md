
# PRD: NGO Event Management Interface
**Version:** 1.0 | **Status:** Draft | **Date:** April 2026

---

## 1. Overview

A dedicated interface within the Social Impact App that allows verified NGOs to create and manage volunteer events. NGOs control volunteer capacity, join policies, and participant approvals.

---

## 2. Goals

- Allow NGOs to create events with structured volunteer requirements
- Give NGOs control over open vs. approval-based joining
- Provide NGOs a dashboard to manage participants and approvals
- Integrate with the existing event and reward system

---

## 3. User Roles

| Role | Description |
|---|---|
| NGO Admin | Verified NGO representative — creates events, manages volunteers |
| Volunteer (User) | Regular app user — discovers and joins NGO events |
| Platform Admin | Anthropic/app admin — verifies NGOs, manages platform |

---

## 4. Feature Specifications

### 4.1 NGO Registration & Verification
- NGO submits registration request with: name, registration number, contact person, email, phone, description, logo
- Platform admin reviews and approves/rejects
- Approved NGOs get `role: "ngo"` and access to NGO dashboard
- NGO profile page visible to volunteers

---

### 4.2 Event Creation Form

NGO fills in the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| Event Title | Text | ✅ | Name of the event |
| Description | Textarea | ✅ | What volunteers will do |
| Activity Type | Dropdown | ✅ | blood_donation / tree_plantation / volunteering / other |
| Date & Time | DateTime picker | ✅ | When the event happens |
| Duration | Number (hours) | ✅ | Expected duration |
| Location | Map picker / text | ✅ | Address + coordinates |
| Volunteers Needed | Number | ✅ | Max no. of volunteers NGO requires |
| Join Policy | Toggle | ✅ | Open Join OR Approval Required |
| Coins Reward | Number | ✅ | Coins awarded on activity verification |
| Certificate Available | Checkbox | ❌ | Whether NGO issues participation certificate |
| Event Image | File upload | ❌ | Banner image for the event |

---

### 4.3 Join Policy — Two Modes

#### Mode 1: Open Join
- Volunteer clicks **"Join"** → immediately added to participants
- No approval needed
- Slot count decrements automatically
- When `participants.length === volunteersNeeded` → event marked **Full**

#### Mode 2: Approval Required
- Volunteer clicks **"Request to Join"** → request enters pending queue
- NGO sees pending requests in their dashboard
- NGO can **Approve** or **Reject** each request
- Approved volunteer → added to participants, slot decrements
- Rejected volunteer → notified with optional reason
- Volunteer sees status: `Pending / Approved / Rejected`

---

### 4.4 NGO Dashboard

**My Events Tab**
- List of all events created by the NGO
- Status indicator: Upcoming / Ongoing / Completed / Full
- Volunteer count: `12 / 30 joined`
- Quick actions: Edit, Cancel, View Participants

**Participant Management Tab** *(for Approval Required events)*
- List of pending join requests
- Each request shows: volunteer name, profile photo, coin balance, past activity count
- Actions: Approve / Reject (with optional rejection reason)
- Filter: Pending / Approved / Rejected

**Event Analytics Tab**
- Total volunteers joined
- Attendance confirmation rate
- Coins distributed
- Activity submissions received

---

### 4.5 Volunteer Experience

**Discovery**
- Events created by NGOs appear in the main event feed
- NGO name and logo displayed on event card
- "Approval Required" badge shown if join policy is approval-based
- Volunteer count shown: `18 / 30 spots filled`

**Joining Flow — Open Join**
```
Volunteer views event → clicks "Join" → 
immediately confirmed → slot decrements → 
notification sent
```

**Joining Flow — Approval Required**
```
Volunteer views event → clicks "Request to Join" → 
status shows "Pending" → NGO reviews → 
Approved: volunteer notified + added |
Rejected: volunteer notified + reason shown
```

---

## 5. Database Schema Changes

### 5.1 NGOs Collection (new)

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique NGO ID |
| `name` | String | NGO name |
| `registrationNumber` | String | Official NGO reg. number |
| `contactPerson` | String | Name of representative |
| `email` | String | Contact email |
| `phone` | String | Contact phone |
| `description` | String | About the NGO |
| `logo` | String (URL) | Logo image URL |
| `isVerified` | Boolean | Verified by platform admin |
| `userId` | ObjectId (ref: Users) | Linked user account |
| `createdAt` | Date | Registration timestamp |

---

### 5.2 Events Collection Changes (additions)

| Field | Type | Description |
|---|---|---|
| `ngoId` | ObjectId (ref: NGOs) | NGO that created the event |
| `volunteersNeeded` | Number | Max volunteers required |
| `joinPolicy` | Enum: `open` / `approval` | Join mode |
| `joinRequests` | [JoinRequest] | Array of join request objects |
| `certificateAvailable` | Boolean | Whether certificate is issued |
| `eventImage` | String (URL) | Banner image URL |

**JoinRequest embedded object:**

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId | Requesting volunteer |
| `status` | Enum: `pending/approved/rejected` | Request status |
| `requestedAt` | Date | When request was made |
| `reviewedAt` | Date | When NGO reviewed |
| `rejectionReason` | String | Optional rejection reason |

---

## 6. API Endpoints

### NGO APIs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/ngo/register` | Submit NGO registration | Required |
| GET | `/ngo/profile` | Get NGO profile | Required |
| PUT | `/ngo/profile` | Update NGO profile | NGO only |
| GET | `/ngo/dashboard` | Get NGO dashboard stats | NGO only |

### Event APIs (additions)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/events` | Create event (NGO) | NGO only |
| GET | `/events/:id/requests` | Get all join requests | NGO only |
| PUT | `/events/:id/requests/:userId` | Approve or reject request | NGO only |
| POST | `/events/:id/request-join` | Request to join (approval mode) | Required |
| GET | `/events/:id/my-request` | Get my join request status | Required |

---

## 7. UI Screens

### Screen 1: NGO Dashboard (Home)
- Stats cards: Total Events, Total Volunteers, Pending Approvals
- Recent events list with quick actions
- "Create New Event" button (prominent CTA)

### Screen 2: Create Event Form
- Multi-step form (3 steps):
  - **Step 1:** Basic info (title, description, activity type, date, location)
  - **Step 2:** Volunteer settings (no. needed, join policy toggle, coins reward)
  - **Step 3:** Extras (certificate toggle, event image upload, preview)
- Live preview of event card as NGO fills in details

### Screen 3: Participant Management
- Tabs: Pending | Approved | Rejected
- Each volunteer card shows: avatar, name, coin balance, activity count
- Approve/Reject buttons on pending tab
- Bulk approve option

### Screen 4: Volunteer — Event Detail (updated)
- Shows NGO name + logo
- Spots remaining: progress bar `18/30`
- Join button changes based on policy:
  - Open: **"Join Event"**
  - Approval: **"Request to Join"**
  - Pending: **"Request Pending..."** (disabled)
  - Approved: **"You're In ✅"**
  - Full: **"Event Full"** (disabled)

---

## 8. Notifications

| Trigger | Who Gets Notified | Message |
|---|---|---|
| New join request | NGO | "New volunteer requested to join [Event Name]" |
| Request approved | Volunteer | "Your request to join [Event Name] was approved!" |
| Request rejected | Volunteer | "Your request to join [Event Name] was not approved" |
| Event full | NGO | "[Event Name] is now full — [X] volunteers confirmed" |
| Event reminder | Volunteer | "Reminder: [Event Name] is tomorrow!" |

---

## 9. Validation Rules

- `volunteersNeeded` must be between 1 and 10,000
- NGO cannot set `volunteersNeeded` to 0
- When slots are full, join/request button is disabled for new volunteers
- NGO cannot approve more volunteers than `volunteersNeeded`
- Event date must be at least 24 hours in the future
- NGO can edit event details only if event is still `upcoming`
- NGO can cancel event up to 2 hours before start time

---

## 10. Development Roadmap

| Phase | Features |
|---|---|
| Phase 1 (MVP) | NGO registration, event creation, open join, participant list |
| Phase 2 | Approval-based joining, join request management, notifications |
| Phase 3 | Event analytics, certificate generation, bulk approvals |
| Phase 4 | NGO public profile page, verified badge, NGO leaderboard |

---

## 11. Out of Scope (v1.0)

- Payment or donation integration
- NGO-to-NGO collaboration
- Multi-language support
- Mobile push notifications (web notifications only in v1)

---

## 12. Glossary

| Term | Definition |
|---|---|
| NGO | Non-Governmental Organization — verified event organizer |
| Open Join | Volunteer joins instantly without approval |
| Approval Required | NGO must approve each volunteer before they're confirmed |
| Volunteers Needed | Maximum number of volunteers the NGO requires for the event |
| Join Request | A volunteer's application to join an approval-required event |
| Slot | One available volunteer spot in an event |
