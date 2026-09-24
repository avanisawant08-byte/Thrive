# PRD: NGO Volunteer Profile View Interface
**Version:** 1.0 | **Status:** Draft | **Date:** April 2026  
**Parent PRD:** NGO Event Management Interface v1.0

---

## 1. Overview

When a volunteer requests to join an approval-required event, the NGO needs enough information to make an informed decision. This PRD defines the interface that allows NGOs to view a detailed volunteer profile — including personal details and past event participation history — before approving or rejecting a join request.

---

## 2. Problem Statement

Currently when a volunteer requests to join an event, the NGO only sees the volunteer's name. This is insufficient for NGOs to:
- Assess the volunteer's experience and reliability
- Verify if the volunteer has relevant past activity
- Make a confident approve/reject decision

---

## 3. Goals

- Give NGOs a complete view of a volunteer's profile before approving them
- Show verified past event participation history
- Help NGOs make informed, fair decisions
- Build trust between NGOs and volunteers on the platform

---

## 4. User Stories

| As a... | I want to... | So that... |
|---|---|---|
| NGO Admin | View a volunteer's personal details | I know who is requesting to join |
| NGO Admin | See past events the volunteer participated in | I can assess their experience |
| NGO Admin | See how many activities were verified/approved | I can judge their reliability |
| NGO Admin | See volunteer's coin balance and rank | I can gauge their overall engagement |
| NGO Admin | Approve or reject directly from the profile view | I don't have to navigate back |
| Volunteer | Know my profile is visible to NGOs | I can keep it updated and relevant |

---

## 5. Feature Specifications

### 5.1 Accessing the Volunteer Profile

- NGO opens their **Participant Management** tab on any approval-required event
- Each pending join request shows a volunteer card with a **"View Profile"** button
- Clicking it opens the **Volunteer Detail View** — either as a modal or a full page
- NGO can navigate between pending requests without going back to the list

---

### 5.2 Volunteer Detail View — Sections

#### Section 1: Personal Details

| Field | Source | Displayed As |
|---|---|---|
| Full Name | Users collection | Large heading |
| Profile Photo | Users collection | Circular avatar |
| Email Address | Users collection | Text with mail icon |
| Location | Users collection (GeoJSON) | City/region text |
| Bio | Users collection | Short paragraph |
| Member Since | `createdAt` field | "Member since March 2024" |
| Role | Users collection | Badge: User / Verified Volunteer |

> ⚠️ Phone number and exact address are NOT shown to protect volunteer privacy.

---

#### Section 2: Activity Stats (Summary Cards)

| Stat | Description |
|---|---|
| Total Activities Submitted | All submissions regardless of status |
| Approved Activities | Submissions that were approved by admin |
| Rejected Activities | Submissions that were rejected |
| Approval Rate | Approved / Total × 100 (shown as %) |
| Total Coins Earned | Lifetime coins earned from activities |
| Current Coin Balance | Available coins in wallet |
| Leaderboard Rank | Global rank on leaderboard |

---

#### Section 3: Past Event Participation History

A chronological list of all events the volunteer has participated in:

**Each event entry shows:**

| Field | Description |
|---|---|
| Event Name | Title of the event |
| Activity Type | Blood Donation / Tree Plantation / Volunteering / Other |
| Event Date | When the event took place |
| Organizer | Who created the event (NGO name or user) |
| Participation Status | Joined / Completed / Dropped |
| Proof Submitted | Yes / No |
| Verification Status | Pending / Approved / Rejected |
| Coins Awarded | How many coins were earned from this event |

**Filters available:**
- Filter by activity type
- Filter by verification status (approved / rejected / pending)
- Sort by: Most Recent / Oldest / Most Coins

---

#### Section 4: Activity Proof Gallery *(optional, NGO discretion)*

- A grid of proof images/videos submitted by the volunteer across all past activities
- Only shows **approved** proofs by default
- Gives NGO a visual sense of the volunteer's genuine participation
- Clicking a proof opens it full screen with event context

---

#### Section 5: NGO's Own History With This Volunteer *(if applicable)*

- If the volunteer has previously joined any of THIS NGO's events, show that history
- "Previously joined 2 of your events" with links to those events
- Helps NGOs recognize returning volunteers

---

### 5.3 Approve / Reject Actions

At the bottom of the Volunteer Detail View, two prominent buttons:

```
[ ✅ Approve Request ]     [ ❌ Reject Request ]
```

- **Approve** → volunteer added to participants, slot decrements, notification sent
- **Reject** → opens a small input for optional rejection reason → sends notification to volunteer
- After action, NGO is taken back to the pending requests list
- Next/Previous arrows to navigate to the next pending request without going back

---

## 6. Database & API Changes

### 6.1 New API Endpoint

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/ngo/volunteers/:userId/profile` | Get full volunteer profile for NGO review | NGO only |

### 6.2 Response Structure

```json
{
  "personalDetails": {
    "_id": "...",
    "name": "Ravi Sharma",
    "email": "ravi@example.com",
    "profilePhoto": "https://...",
    "bio": "Passionate about environment",
    "location": "Pune, Maharashtra",
    "memberSince": "2024-03-15",
    "coinBalance": 450,
    "role": "user"
  },
  "activityStats": {
    "totalSubmitted": 12,
    "totalApproved": 9,
    "totalRejected": 2,
    "approvalRate": 75,
    "totalCoinsEarned": 850,
    "leaderboardRank": 34
  },
  "eventHistory": [
    {
      "eventId": "...",
      "eventTitle": "Blood Donation Camp",
      "activityType": "blood_donation",
      "eventDate": "2024-08-10",
      "organizerName": "Red Cross Pune",
      "participationStatus": "completed",
      "proofSubmitted": true,
      "verificationStatus": "approved",
      "coinsAwarded": 100
    }
  ],
  "proofGallery": [
    {
      "mediaUrl": "https://cloudinary.com/...",
      "eventTitle": "Tree Plantation Drive",
      "approvedAt": "2024-07-20"
    }
  ],
  "historyWithThisNGO": [
    {
      "eventId": "...",
      "eventTitle": "Cleanup Drive",
      "joinedAt": "2024-06-01",
      "status": "completed"
    }
  ]
}
```

### 6.3 Privacy Rules (Backend Enforced)

- Phone number → never returned in this endpoint
- Exact GPS coordinates → never returned, only city/region name
- Password hash → never returned (already excluded globally)
- Rejected proof media → excluded from proof gallery

---

## 7. UI Design Specifications

### Layout — Desktop
```
┌─────────────────────────────────────────────────────┐
│  ← Back to Requests          Volunteer 3 of 7  ← → │
├──────────────┬──────────────────────────────────────┤
│   [Avatar]   │  Ravi Sharma                         │
│              │  📍 Pune, Maharashtra                │
│              │  📧 ravi@example.com                 │
│              │  Member since March 2024             │
│              │  "Passionate about environment"      │
├──────────────┴──────────────────────────────────────┤
│  STATS                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │  12    │ │  9     │ │  75%   │ │  #34   │       │
│  │ Total  │ │Approved│ │Approval│ │  Rank  │       │
│  └────────┘ └────────┘ └────────┘ └────────┘       │
├─────────────────────────────────────────────────────┤
│  PAST EVENT PARTICIPATION          [Filter] [Sort]  │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🩸 Blood Donation Camp     Aug 2024         │   │
│  │    Red Cross Pune  •  ✅ Approved  •  +100  │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🌳 Tree Plantation Drive   Jul 2024         │   │
│  │    GreenEarth NGO  •  ✅ Approved  •  +75   │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  PROOF GALLERY                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │ img  │ │ img  │ │ img  │ │ img  │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
├─────────────────────────────────────────────────────┤
│         [ ✅ Approve Request ]  [ ❌ Reject ]       │
└─────────────────────────────────────────────────────┘
```

### Layout — Mobile
- Stacked single column layout
- Stats shown as 2×2 grid
- Event history as scrollable list
- Approve/Reject buttons fixed at bottom of screen

---

## 8. Validation & Edge Cases

| Scenario | Behaviour |
|---|---|
| Volunteer has no past events | Show "No past participation yet" with encouraging message |
| Volunteer has 0 approved activities | Show approval rate as 0% with neutral (not negative) tone |
| Volunteer already approved for this event | "View Profile" button still works but approve/reject buttons hidden |
| NGO tries to approve beyond volunteer limit | System blocks approval, shows "Event is full" |
| Volunteer withdraws request before NGO reviews | Profile view shows "Request withdrawn" state |
| Volunteer has no profile photo | Show initials avatar as fallback |
| Proof media fails to load | Show placeholder with "Media unavailable" |

---

## 9. Privacy & Ethics Considerations

- Volunteers must be informed (in app onboarding) that their activity history is visible to NGOs when requesting to join approval-required events
- NGOs cannot download or export volunteer data
- Rejection reasons are private between NGO and volunteer — not shown publicly
- Volunteers can choose to hide their proof gallery from NGO view in profile settings

---

## 10. Development Roadmap

| Phase | Features |
|---|---|
| Phase 1 | Personal details + activity stats + approve/reject from profile |
| Phase 2 | Past event history list with filters |
| Phase 3 | Proof gallery, history with this NGO, navigation arrows |
| Phase 4 | Volunteer privacy settings, data visibility controls |

---

## 11. Dependencies

- Requires **NGO Event Management Interface PRD v1.0** to be implemented first
- Requires **Cloudinary** integration for proof gallery media loading
- Requires **Activities collection** to have `eventId` populated correctly
- Requires **Leaderboard API** to return individual user rank

---

## 12. Glossary

| Term | Definition |
|---|---|
| Join Request | A volunteer's application to join an approval-required event |
| Volunteer Detail View | The full profile screen shown to NGO during request review |
| Approval Rate | Percentage of submitted activities that were approved by admin |
| Proof Gallery | Grid of verified proof images/videos from past activities |
| History with this NGO | Past events the volunteer joined specifically from this NGO |
