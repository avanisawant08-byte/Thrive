# PRD: NGO Follow System & Posts
**Version:** 1.0 | **Status:** Draft | **Date:** April 2026

---

## 1. Overview

This feature allows users to follow NGOs they care about and receive real-time notifications when the NGO creates a new event or publishes a post. NGOs get a dedicated feed to share updates, announcements, and impact stories with their followers.

---

## 2. Goals

- Allow users to follow/unfollow NGOs
- Notify followers instantly when an NGO creates a new event or post
- Give NGOs a content channel to engage their volunteer community
- Increase event participation through targeted follower notifications

---

## 3. User Stories

| As a... | I want to... | So that... |
|---|---|---|
| User | Follow an NGO | I stay updated on their activities |
| User | Receive notification when NGO posts | I don't miss new events or updates |
| User | See all posts from NGOs I follow | I can engage with their content |
| User | Unfollow an NGO | I stop receiving their notifications |
| NGO | Create posts with text/images | I can share updates with my followers |
| NGO | See my follower count | I can track my community growth |
| NGO | Know my post reached followers | I can measure engagement |

---

## 4. Feature Specifications

### 4.1 Follow / Unfollow NGO

- Every NGO profile page has a **"Follow"** button
- Clicking Follow:
  - Adds NGO to user's `followingNGOs` list
  - Adds user to NGO's `followers` list
  - Button changes to **"Following"** with unfollow option
- Clicking Unfollow:
  - Removes from both lists
  - User stops receiving notifications from that NGO
- Follower count displayed publicly on NGO profile
- User can see all NGOs they follow in their profile under **"Following"** tab

---

### 4.2 NGO Posts

NGO can create two types of posts:

#### Type 1: General Post
- Text content (up to 500 characters)
- Optional image attachment (stored on Cloudinary)
- Optional external link
- Visible to all followers in their feed

#### Type 2: Event Announcement Post (auto-generated)
- Automatically created when NGO publishes a new event
- Contains event title, date, location, spots available
- Deep link to the event detail page
- Cannot be manually deleted by NGO (tied to event lifecycle)

---

### 4.3 NGO Post Creation Form

| Field | Type | Required | Description |
|---|---|---|---|
| Content | Textarea (500 chars) | ✅ | Post text |
| Image | File upload | ❌ | Optional image (Cloudinary) |
| Link | URL input | ❌ | Optional external link |
| Post Type | Auto-set | — | `general` or `event_announcement` |

---

### 4.4 Notification System

#### Notification Triggers

| Trigger | Who Gets Notified | Notification Text |
|---|---|---|
| NGO creates new event | All NGO followers | "🌱 [NGO Name] just created a new event: [Event Title]" |
| NGO publishes a post | All NGO followers | "📢 [NGO Name] posted an update" |
| NGO reaches milestone (100 followers) | NGO admin | "🎉 You just hit [X] followers!" |

#### Notification Delivery

- **In-app notifications** — bell icon with unread count badge
- **Push notifications** — via Firebase Cloud Messaging (FCM) for mobile
- User can control notification preferences per NGO:
  - All notifications ON
  - Only new events ON
  - All notifications OFF (muted)

#### Notification Object

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique notification ID |
| `userId` | ObjectId | User receiving the notification |
| `type` | Enum | `new_event` / `new_post` / `milestone` |
| `ngoId` | ObjectId | NGO that triggered it |
| `referenceId` | ObjectId | Event ID or Post ID |
| `message` | String | Notification text |
| `isRead` | Boolean | Read status |
| `createdAt` | Date | Timestamp |

---

### 4.5 Follower Feed

- A dedicated **"Feed"** tab in the app
- Shows posts from all NGOs the user follows
- Sorted by most recent first
- Each feed item shows:
  - NGO logo + name
  - Time posted (e.g., "2 hours ago")
  - Post content + image (if any)
  - For event announcements: event card with "View Event" button
  - Like count + Like button
  - Comment count + Comment button

---

### 4.6 NGO Profile Page (updated)

| Section | Content |
|---|---|
| Header | Logo, name, verified badge, follower count |
| Follow Button | Follow / Following toggle |
| About | NGO description, registration number, contact |
| Events Tab | All upcoming and past events by this NGO |
| Posts Tab | All posts published by this NGO |
| Stats | Total events hosted, total volunteers engaged, total coins distributed |

---

## 5. Database Schema

### 5.1 NGOFollows Collection (new)

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique record ID |
| `userId` | ObjectId (ref: Users) | User who is following |
| `ngoId` | ObjectId (ref: NGOs) | NGO being followed |
| `notificationPreference` | Enum | `all` / `events_only` / `muted` |
| `followedAt` | Date | When user followed |

---

### 5.2 NGOPosts Collection (new)

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique post ID |
| `ngoId` | ObjectId (ref: NGOs) | NGO that created the post |
| `type` | Enum | `general` / `event_announcement` |
| `content` | String | Post text (max 500 chars) |
| `imageUrl` | String (URL) | Cloudinary image URL |
| `link` | String | Optional external link |
| `eventId` | ObjectId (ref: Events) | Linked event (if announcement) |
| `likes` | [ObjectId] | Array of user IDs who liked |
| `comments` | [Comment] | Embedded comment objects |
| `createdAt` | Date | Post timestamp |

---

### 5.3 Notifications Collection (new)

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique notification ID |
| `userId` | ObjectId (ref: Users) | Recipient user |
| `type` | Enum | `new_event` / `new_post` / `milestone` |
| `ngoId` | ObjectId (ref: NGOs) | Source NGO |
| `referenceId` | ObjectId | Event ID or Post ID |
| `message` | String | Notification message |
| `isRead` | Boolean | Default: false |
| `createdAt` | Date | Timestamp |

---

### 5.4 NGOs Collection (additions)

| Field | Type | Description |
|---|---|---|
| `followerCount` | Number | Cached follower count |
| `fcmTokens` | [String] | For sending push via FCM |

---

## 6. API Endpoints

### Follow APIs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/ngo/:id/follow` | Follow an NGO | Required |
| DELETE | `/ngo/:id/follow` | Unfollow an NGO | Required |
| GET | `/ngo/:id/followers` | Get NGO follower list | Public |
| GET | `/user/following-ngos` | Get NGOs user follows | Required |
| PUT | `/ngo/:id/follow/preference` | Update notification preference | Required |

### Post APIs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/ngo/posts` | Create a new post | NGO only |
| GET | `/ngo/:id/posts` | Get all posts by NGO | Public |
| DELETE | `/ngo/posts/:postId` | Delete a post | NGO only |
| POST | `/ngo/posts/:postId/like` | Like a post | Required |
| POST | `/ngo/posts/:postId/comments` | Comment on a post | Required |

### Feed APIs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/feed` | Get posts from followed NGOs | Required |

### Notification APIs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/notifications` | Get all notifications for user | Required |
| PUT | `/notifications/:id/read` | Mark notification as read | Required |
| PUT | `/notifications/read-all` | Mark all as read | Required |

---

## 7. Notification Flow (Technical)

### When NGO Creates New Event:
```
NGO submits new event
→ Event saved in MongoDB
→ Auto-generate event_announcement post
→ Backend fetches all followers of NGO
   (where notificationPreference != "muted")
→ Create Notification document for each follower
→ Send FCM push notification to each follower's device
→ User sees bell icon badge update in real-time (Socket.io)
```

### When NGO Creates General Post:
```
NGO submits post
→ Post saved in MongoDB
→ Backend fetches followers
   (where notificationPreference = "all")
→ Create Notification document for each follower
→ Send FCM push notification
→ Post appears in follower feed
```

---

## 8. UI Screens

### Screen 1: NGO Profile Page
- Header with logo, name, verified badge
- **Follow / Following** button (top right)
- Follower count displayed
- Tabs: About | Events | Posts
- Posts tab shows all NGO posts in a card feed

### Screen 2: Feed Tab (User)
- New tab added to bottom navigation: **"Feed"**
- Shows posts from all followed NGOs
- Empty state: "Follow NGOs to see their updates here"
- Infinite scroll pagination
- Pull to refresh

### Screen 3: Notifications Screen
- Bell icon in top nav with unread badge count
- List of notifications sorted by newest first
- Each item: NGO logo, message, time ago, unread dot
- Tap on notification → navigates to relevant event or post
- "Mark all as read" button at top

### Screen 4: NGO Post Creation (NGO Dashboard)
- Text area with character counter (500 max)
- Image upload button (Cloudinary)
- Optional link field
- Preview before publishing
- **"Publish Post"** button

### Screen 5: User Profile — Following Tab
- List of all NGOs the user follows
- Each item: NGO logo, name, follower count
- Notification preference toggle per NGO
- Unfollow button

---

## 9. Notification Preference Controls

User can control per-NGO:

| Setting | Behaviour |
|---|---|
| All Notifications | Notified on new events AND new posts |
| Events Only | Notified only when NGO creates a new event |
| Muted | No notifications from this NGO (still following) |

Default preference on follow: **All Notifications**

---

## 10. Validation Rules

- User cannot follow the same NGO twice
- NGO cannot follow themselves
- Post content cannot be empty
- Post image size limit: 5 MB
- Post content max: 500 characters
- Event announcement posts are auto-created — NGO cannot create them manually
- Notifications older than 90 days are auto-deleted
- FCM tokens are refreshed on every app login

---

## 11. Development Roadmap

| Phase | Features |
|---|---|
| Phase 1 | Follow/unfollow, in-app notifications, basic feed |
| Phase 2 | NGO general posts, image uploads via Cloudinary, like/comment |
| Phase 3 | Push notifications via FCM, notification preferences per NGO |
| Phase 4 | Feed algorithm (ranked by engagement), NGO milestone notifications |

---

## 12. Out of Scope (v1.0)

- NGO Stories (ephemeral 24hr posts)
- Paid promoted posts
- Direct messaging between user and NGO
- Email notification digest

---

## 13. Glossary

| Term | Definition |
|---|---|
| Follow | User subscribing to an NGO's updates |
| Feed | Chronological stream of posts from followed NGOs |
| Post | Content published by NGO — text, image, or event announcement |
| Event Announcement | Auto-generated post when NGO creates a new event |
| Notification Preference | Per-NGO setting controlling what triggers a notification |
| FCM | Firebase Cloud Messaging — service used to send push notifications |
| Muted | Following an NGO but suppressing all notifications from them |
