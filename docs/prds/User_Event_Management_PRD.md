# PRD: User Event Management — Cancellation, Notifications, Status & Sorting
**Version:** 1.0 | **Status:** Draft | **Date:** May 2026

---

## 1. Overview

This PRD covers four enhancements to the user-side event system within the Social Impact App. These features improve the experience for regular users (non-NGO) who create and manage their own events — giving them the ability to cancel events with a reason, notify applied volunteers, see their event's live status on their portal, and always see the newest events at the top of the feed.

---

## 2. Goals

- Allow users to cancel self-created events with a mandatory cancellation reason
- Notify all applied/joined volunteers when an event is cancelled
- Show users whether their launched event is live, pending, or cancelled on their profile portal
- Sort all event listings so newest events always appear at the top

---

## 3. User Stories

| As a... | I want to... | So that... |
|---|---|---|
| Event Creator | Cancel my event if I can't organize it | I don't leave volunteers waiting |
| Event Creator | Provide a reason for cancellation | Volunteers understand why it was cancelled |
| Event Creator | See the status of my launched event | I know if it's live, pending approval, or cancelled |
| Volunteer | Get notified when an event I applied to is cancelled | I can make other plans |
| Volunteer | See cancellation reason in the notification | I understand what happened |
| Volunteer | Always see newest events at the top | I don't miss recent opportunities |
| App User | See events sorted by newest first | I see the most relevant events |

---

## 4. Feature 1: Event Cancellation by User

### 4.1 Who Can Cancel

- Only the **creator** of the event can cancel it
- Admin can also cancel any event from the admin panel
- NGO events are handled separately (NGO dashboard)
- Cancellation is only allowed if event status is `upcoming` or `ongoing`
- Cannot cancel a `completed` event

---

### 4.2 Cancellation Flow

```
User goes to their profile portal → My Events tab
→ Clicks on their event
→ Clicks "Cancel Event" button (red, bottom of event detail)
→ Cancellation modal appears
→ User selects reason from dropdown + optional custom message
→ Clicks "Confirm Cancellation"
→ System cancels event
→ Notifications sent to all applied/joined volunteers
→ Event status changes to "cancelled" on portal
```

---

### 4.3 Cancellation Modal UI

The modal that appears when user clicks "Cancel Event":

```
┌─────────────────────────────────────────┐
│  ⚠️  Cancel Event                        │
│                                         │
│  Are you sure you want to cancel        │
│  "[Event Title]"?                        │
│                                         │
│  Reason for cancellation *              │
│  ┌─────────────────────────────────┐    │
│  │ Select a reason ▼               │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Additional message (optional)          │
│  ┌─────────────────────────────────┐    │
│  │ Add a note for your volunteers  │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Keep Event]    [Confirm Cancellation] │
└─────────────────────────────────────────┘
```

---

### 4.4 Cancellation Reason Options (Dropdown)

| Reason | Description |
|---|---|
| Personal emergency | Unable to attend due to personal reasons |
| Insufficient volunteers | Not enough people joined to run the event |
| Weather conditions | Bad weather makes event unsafe or impossible |
| Venue unavailable | Location is no longer accessible |
| Scheduling conflict | Event clashes with another commitment |
| Lack of resources | Materials/resources not arranged in time |
| Health reasons | Organizer is unwell |
| Other | Custom reason (requires text input) |

> If "Other" is selected → the additional message field becomes **mandatory**

---

### 4.5 Cancellation Rules & Validations

- Cancellation reason is **mandatory** — cannot proceed without selecting one
- If "Other" is selected, custom message is mandatory (min 20 characters)
- User cannot cancel within **2 hours** of the event start time
- Once cancelled, the event **cannot be un-cancelled**
- Cancelled events still visible on creator's portal with `CANCELLED` status
- Volunteers who paid coins to join (if any) receive a **full refund**
- Cancelled events are removed from the public event discovery feed

---

### 4.6 What Happens After Cancellation

| Action | Description |
|---|---|
| Event status | Changes to `cancelled` |
| Public feed | Event removed from discovery list |
| Creator portal | Event remains visible with CANCELLED badge |
| Applied volunteers | All notified with reason |
| Joined volunteers | All notified with reason |
| Coin refunds | Any spent coins refunded automatically |
| Activity submissions | Any pending submissions linked to event are voided |

---

## 5. Feature 2: Notifications to Applied/Joined Users

### 5.1 Notification Triggers

Users who have **applied for** or **joined** an event must be notified in the following scenarios:

| Trigger | Who Gets Notified | Notification Type |
|---|---|---|
| Event cancelled by creator | All applied + joined volunteers | Push + In-app |
| Event details updated (date/time/location) | All joined volunteers | Push + In-app |
| Event is about to start (24 hrs before) | All joined volunteers | Push + In-app |
| Event is about to start (1 hr before) | All joined volunteers | Push + In-app |
| Join request approved (approval events) | Requesting volunteer | Push + In-app |
| Join request rejected (approval events) | Requesting volunteer | Push + In-app |
| Event marked as completed | All joined volunteers | In-app only |
| Event is full (no more spots) | Users who requested but weren't approved | In-app only |

---

### 5.2 Cancellation Notification Content

When event is cancelled, all applied/joined users receive:

**Push Notification:**
```
🚫 Event Cancelled
"[Event Title]" has been cancelled by the organizer.
Reason: [Selected Reason]
```

**In-App Notification (detailed):**
```
🚫 Event Cancelled

"[Event Title]" scheduled for [Date] at [Location]
has been cancelled by the organizer.

Reason: [Selected Reason]
[Optional custom message from organizer]

We're sorry for the inconvenience.
Any coins spent have been refunded to your account.
```

---

### 5.3 Other Event Notification Templates

**24 hours before event:**
```
⏰ Event Tomorrow!
"[Event Title]" is happening tomorrow at [Time].
📍 [Location]
Don't forget to bring [any requirements]!
```

**1 hour before event:**
```
🌟 Starting Soon!
"[Event Title]" starts in 1 hour.
📍 [Location]
Get ready to make an impact!
```

**Join request approved:**
```
✅ You're In!
Your request to join "[Event Title]" has been approved.
📅 [Date] | 📍 [Location]
See you there!
```

**Join request rejected:**
```
❌ Request Not Approved
Your request to join "[Event Title]" was not approved.
[Reason if provided by organizer]
Check out other events near you!
```

**Event details updated:**
```
📝 Event Updated
"[Event Title]" has been updated by the organizer.
New Date: [Date] | New Location: [Location]
Please check the latest details.
```

---

### 5.4 Notification Delivery

- **In-app:** Bell icon with unread count badge, notification center
- **Push notification:** Firebase Cloud Messaging (FCM) for mobile
- Notifications are stored in the Notifications collection
- User can mark individual notifications as read
- User can mark all notifications as read
- Notifications older than 90 days auto-deleted

---

### 5.5 Notification Preferences (User Settings)

User can control which notifications they receive:

| Setting | Default | Description |
|---|---|---|
| Event cancellations | ON | Notify when joined event is cancelled |
| Event reminders | ON | 24hr and 1hr before event |
| Join request updates | ON | Approval / rejection notifications |
| Event updates | ON | When organizer edits event details |
| New events nearby | ON | When new events are posted near user |

---

## 6. Feature 3: Event Status Display on User Portal

### 6.1 My Events Section

In the user's profile portal, a dedicated **"My Events"** tab shows all events the user has created:

```
Profile → My Events Tab
├── Events I Created
│   ├── [Event Card with STATUS badge]
│   ├── [Event Card with STATUS badge]
│   └── ...
└── Events I Joined
    ├── [Event Card with STATUS badge]
    └── ...
```

---

### 6.2 Event Status Badges

Each event card in the user portal displays a clear status badge:

| Status | Badge Color | Description |
|---|---|---|
| `PENDING APPROVAL` | 🟡 Yellow | Event submitted, waiting for admin approval |
| `LIVE` | 🟢 Green | Event is approved and visible to public |
| `UPCOMING` | 🔵 Blue | Approved and scheduled for future date |
| `ONGOING` | 🟢 Green + pulse animation | Currently happening |
| `COMPLETED` | ⚫ Grey | Event has ended |
| `CANCELLED` | 🔴 Red | Cancelled by creator or admin |
| `REJECTED` | 🔴 Red | Admin rejected the event |

---

### 6.3 Event Card in User Portal

Each event card shows:

```
┌────────────────────────────────────────────┐
│  🌱 Tree Plantation Drive          [LIVE ●] │
│  📅 15 May 2026 | ⏰ 9:00 AM               │
│  📍 Pune, Maharashtra                      │
│  👥 12 / 30 volunteers joined              │
│  🪙 50 coins reward                        │
│                                            │
│  [View Details]    [Cancel Event ✕]        │
└────────────────────────────────────────────┘
```

- **Cancel Event** button only visible if status is `upcoming` or `ongoing`
- **Cancel Event** button hidden if status is `completed`, `cancelled`, or `rejected`
- Clicking **View Details** → opens full event detail page
- PENDING APPROVAL events show: "Your event is under review by our team"
- REJECTED events show rejection reason from admin

---

### 6.4 Event Approval Flow (if admin approval required)

```
User creates event
→ Status: PENDING APPROVAL (yellow badge on portal)
→ Admin reviews
→ Approved: Status changes to UPCOMING/LIVE (green badge)
   → User notified: "Your event has been approved and is now live!"
→ Rejected: Status changes to REJECTED (red badge)
   → User notified: "Your event was rejected. Reason: [reason]"
```

---

### 6.5 Status Update Notifications to Creator

| Event | Notification to Creator |
|---|---|
| Event approved by admin | "✅ Your event '[Title]' is now LIVE!" |
| Event rejected by admin | "❌ Your event '[Title]' was rejected. Reason: [reason]" |
| Event gets first volunteer | "🎉 Someone just joined '[Title]'! [X] volunteers so far." |
| Event becomes full | "🎊 '[Title]' is full! [X] volunteers confirmed." |
| Event completed | "🏆 '[Title]' is marked complete. Coins have been distributed." |

---

## 7. Feature 4: Newest Events at Top (Sorting)

### 7.1 Default Sort Order

All event listings across the app are sorted **newest first** by default:

- Events are sorted by `createdAt` timestamp in **descending order**
- Most recently created events appear at the top
- This applies to: main event discovery feed, search results, category filters, NGO event listings, user portal event history

---

### 7.2 Sort Options Available to User

Users can change sort order using a sort control in the event feed:

| Sort Option | Description |
|---|---|
| 🆕 Newest First (default) | Most recently created at top |
| 📅 Date: Soonest First | Events happening soonest at top |
| 📍 Nearest First | Events closest to user's location |
| 🔥 Most Popular | Events with most volunteers joined |
| 🪙 Highest Reward | Events offering most coins |

---

### 7.3 Pinned Events

- Admin can **pin** urgent or featured events to always show at top regardless of sort
- Pinned events have a 📌 pin icon
- Maximum 3 pinned events at any time
- Pinned events appear above the sorted list

---

### 7.4 Sorting Behaviour by Section

| Section | Default Sort | User Can Change? |
|---|---|---|
| Event Discovery Feed | Newest First | ✅ Yes |
| Search Results | Newest First | ✅ Yes |
| My Created Events (portal) | Newest First | ✅ Yes |
| My Joined Events (portal) | Event Date Soonest | ✅ Yes |
| NGO Events list | Newest First | ✅ Yes |
| Category filtered events | Newest First | ✅ Yes |
| Leaderboard events | Most Popular | ❌ No |

---

## 8. Database Schema Changes

### 8.1 Events Collection (additions)

| Field | Type | Description |
|---|---|---|
| `status` | Enum | `pending_approval` / `upcoming` / `ongoing` / `completed` / `cancelled` / `rejected` |
| `cancelledAt` | Date | Timestamp of cancellation |
| `cancellationReason` | String | Selected reason from dropdown |
| `cancellationMessage` | String | Optional custom message from creator |
| `cancelledBy` | ObjectId (ref: Users) | Who cancelled (creator or admin) |
| `rejectionReason` | String | Admin rejection reason |
| `isPinned` | Boolean | Admin pinned event |
| `pinnedAt` | Date | When event was pinned |

---

### 8.2 Notifications Collection (new/additions)

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique notification ID |
| `userId` | ObjectId (ref: Users) | Recipient user |
| `type` | Enum | `event_cancelled` / `event_updated` / `event_reminder_24h` / `event_reminder_1h` / `request_approved` / `request_rejected` / `event_approved` / `event_rejected` / `event_full` / `event_completed` / `new_volunteer` |
| `eventId` | ObjectId (ref: Events) | Related event |
| `message` | String | Notification text |
| `subMessage` | String | Additional detail (e.g. cancellation reason) |
| `isRead` | Boolean | Default: false |
| `createdAt` | Date | Timestamp |

---

### 8.3 UserNotificationPreferences Collection (new)

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique ID |
| `userId` | ObjectId (ref: Users) | User |
| `eventCancellations` | Boolean | Default: true |
| `eventReminders` | Boolean | Default: true |
| `joinRequestUpdates` | Boolean | Default: true |
| `eventUpdates` | Boolean | Default: true |
| `newEventsNearby` | Boolean | Default: true |
| `updatedAt` | Date | Last updated |

---

## 9. API Endpoints

### Event Cancellation APIs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| PUT | `/events/:id/cancel` | Cancel an event with reason | Creator only |
| GET | `/events/:id/cancellation` | Get cancellation details | Required |

**Request Body for cancel:**
```json
{
  "cancellationReason": "Insufficient volunteers",
  "cancellationMessage": "We didn't get enough people to make this work safely."
}
```

---

### User Portal APIs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/user/events/created` | Get all events created by user | Required |
| GET | `/user/events/joined` | Get all events user joined | Required |
| GET | `/events?sort=newest` | Get events sorted by newest | Public |
| GET | `/events?sort=soonest` | Get events sorted by date | Public |
| GET | `/events?sort=nearest&lat=&lng=` | Get events by distance | Public |
| GET | `/events?sort=popular` | Get events by volunteer count | Public |

---

### Notification APIs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/notifications` | Get all notifications for user | Required |
| GET | `/notifications/unread-count` | Get unread count (for badge) | Required |
| PUT | `/notifications/:id/read` | Mark single notification as read | Required |
| PUT | `/notifications/read-all` | Mark all as read | Required |
| DELETE | `/notifications/:id` | Delete a notification | Required |
| GET | `/notifications/preferences` | Get notification preferences | Required |
| PUT | `/notifications/preferences` | Update preferences | Required |

---

## 10. Backend Implementation Notes

### 10.1 Cancel Event Route

```js
// PUT /events/:id/cancel
router.put("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ message: "Event not found." });

    // Only creator can cancel
    if (event.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only the event creator can cancel." });

    // Cannot cancel completed or already cancelled events
    if (["completed", "cancelled", "rejected"].includes(event.status))
      return res.status(400).json({ message: `Cannot cancel an event with status: ${event.status}` });

    // Cannot cancel within 2 hours of start
    const twoHoursBefore = new Date(event.date.getTime() - 2 * 60 * 60 * 1000);
    if (new Date() > twoHoursBefore)
      return res.status(400).json({ message: "Cannot cancel event within 2 hours of start time." });

    const { cancellationReason, cancellationMessage } = req.body;

    if (!cancellationReason)
      return res.status(400).json({ message: "Cancellation reason is required." });

    if (cancellationReason === "Other" && (!cancellationMessage || cancellationMessage.length < 20))
      return res.status(400).json({ message: "Please provide a detailed reason (min 20 characters)." });

    // Update event status
    event.status = "cancelled";
    event.cancelledAt = new Date();
    event.cancellationReason = cancellationReason;
    event.cancellationMessage = cancellationMessage || "";
    event.cancelledBy = req.user._id;
    await event.save();

    // Get all applied + joined users
    const allAffectedUsers = [
      ...event.participants,
      ...event.joinRequests
        .filter(r => ["pending", "approved"].includes(r.status))
        .map(r => r.userId)
    ];

    // Remove duplicates
    const uniqueUsers = [...new Set(allAffectedUsers.map(id => id.toString()))];

    // Create notification for each user
    const notifications = uniqueUsers.map(userId => ({
      userId,
      type: "event_cancelled",
      eventId: event._id,
      message: `🚫 "${event.title}" has been cancelled.`,
      subMessage: `Reason: ${cancellationReason}${cancellationMessage ? ` — ${cancellationMessage}` : ""}`,
      isRead: false,
      createdAt: new Date(),
    }));

    await Notification.insertMany(notifications);

    // TODO: Send FCM push notifications to all affected users

    return res.status(200).json({
      message: "Event cancelled successfully. All volunteers have been notified.",
      cancelledAt: event.cancelledAt,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

---

### 10.2 Sorted Events Query

```js
// GET /events?sort=newest&type=&lat=&lng=&radius=
router.get("/", async (req, res) => {
  try {
    const { sort = "newest", type, lat, lng, radius } = req.query;
    let query = { status: { $nin: ["cancelled", "rejected"] } };
    let sortObj = {};

    // Activity type filter
    if (type) query.activityType = type;

    // Location filter
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius) || 10000,
        },
      };
    }

    // Sort options
    switch (sort) {
      case "newest":
        sortObj = { isPinned: -1, createdAt: -1 }; // pinned first, then newest
        break;
      case "soonest":
        sortObj = { isPinned: -1, date: 1 };
        break;
      case "popular":
        sortObj = { isPinned: -1, "participants.length": -1 };
        break;
      case "reward":
        sortObj = { isPinned: -1, coinsReward: -1 };
        break;
      default:
        sortObj = { isPinned: -1, createdAt: -1 };
    }

    const events = await Event.find(query)
      .sort(sortObj)
      .populate("createdBy", "name profilePhoto")
      .populate("ngoId", "name logo isVerified");

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

---

## 11. UI Flow Summary

### Cancel Event Flow
```
My Profile → My Events Tab
→ See event with LIVE/UPCOMING badge
→ Click "Cancel Event" button
→ Modal appears with reason dropdown
→ Select reason → optional message
→ Click "Confirm Cancellation"
→ Event badge changes to CANCELLED (red)
→ Volunteers receive push + in-app notification
```

### Volunteer Notification Flow
```
Volunteer joined Event X
→ Creator cancels Event X
→ Volunteer receives push: "🚫 Event Cancelled: [Title]"
→ Opens app → Notification bell shows unread badge
→ Opens notification → sees full reason + message
→ Event removed from their "Joined Events" active list
→ Coins refunded if applicable
```

### Status Display Flow
```
User creates event
→ Portal shows: [PENDING APPROVAL] yellow badge
→ Admin approves
→ Portal shows: [LIVE] green badge
→ User gets notification: "Your event is now live!"
→ Event date passes
→ Portal shows: [COMPLETED] grey badge
```

---

## 12. Validation Rules Summary

- Only event creator or admin can cancel an event
- Cannot cancel `completed`, `cancelled`, or `rejected` events
- Cannot cancel within 2 hours of event start time
- Cancellation reason is always mandatory
- If reason is "Other" → custom message mandatory (min 20 chars)
- Cancelled events removed from public discovery feed
- Cancelled events remain visible on creator's portal with CANCELLED badge
- All notifications must be sent within 60 seconds of cancellation
- New events always default sort: newest first (`createdAt DESC`)
- Pinned events always appear above sorted list

---

## 13. Development Roadmap

| Phase | Features |
|---|---|
| Phase 1 (MVP) | Cancel event with reason, notification to applied/joined users, event status badges on portal |
| Phase 2 | Notification preferences, 24hr + 1hr event reminders, admin rejection flow with reason |
| Phase 3 | Sort options (soonest, nearest, popular, reward), pinned events by admin |
| Phase 4 | FCM push notifications, coin refund on cancellation, email notifications |

---

## 14. Out of Scope (v1.0)

- Rescheduling an event (edit date/time) without cancelling
- Transferring event ownership to another user
- Partial cancellation (cancelling for some volunteers only)
- Waitlist system for full events
- Automated cancellation if minimum volunteers not met

---

## 15. Glossary

| Term | Definition |
|---|---|
| Event Creator | User who originally created and launched the event |
| Cancellation Reason | Mandatory dropdown selection explaining why event was cancelled |
| Applied Volunteer | User who submitted a join request (pending approval) |
| Joined Volunteer | User who is confirmed participant in the event |
| PENDING APPROVAL | Event submitted by user, awaiting admin review before going live |
| LIVE | Event approved by admin and visible to all users |
| CANCELLED | Event terminated by creator or admin before completion |
| REJECTED | Event denied by admin during review |
| Newest First | Default sort order — most recently created events appear at top |
| Pinned Event | Admin-highlighted event that always appears above the sorted list |
| FCM | Firebase Cloud Messaging — push notification service |
| Notification Preferences | User settings controlling which notifications they receive |
