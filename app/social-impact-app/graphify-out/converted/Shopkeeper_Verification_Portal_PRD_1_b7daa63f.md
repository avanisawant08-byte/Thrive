<!-- converted from Shopkeeper_Verification_Portal_PRD_1.docx -->

Social Impact Reward App
Shopkeeper Verification Portal
Product Requirements Document (PRD)
Version 1.0  |  Confidential  |  2026

# 1. Overview
The Shopkeeper Verification Portal is a dedicated web interface for registered shop owners (cafes, hotels, restaurants, retail stores, etc.) who are partners in the Social Impact Reward App ecosystem. When a user redeems coins for a coupon in the app, they receive a unique coupon code. The shopkeeper uses this portal to verify the authenticity of that code before providing the discount or service.
This document defines the product requirements for building this portal as part of the existing Social Impact Reward App platform.

# 2. Problem Statement
Currently the app generates coupon codes upon redemption but there is no mechanism for shopkeepers to:
- Verify whether a code is genuine or already used
- Mark a code as redeemed to prevent double usage
- Access a dashboard showing redemption activity for their store
- Operate independently from the main user and admin interfaces
Without a dedicated verification portal, coupon fraud is possible and shopkeepers have no reliable way to validate codes presented by customers.

# 3. Goals
## 3.1 Primary Goals
- Provide shopkeepers a dedicated login-protected portal
- Allow instant coupon code verification (valid / invalid / already used)
- Mark codes as redeemed upon successful verification
- Keep shopkeeper interface completely isolated from user and admin interfaces
## 3.2 Out of Scope (v1)
- Shopkeeper self-registration (admin will create shopkeeper accounts)
- Multi-location / multi-branch management
- Analytics and revenue reporting

# 4. User Roles

A shopkeeper cannot access the dashboard, events, activities, leaderboard, store, or admin panel. Upon login, they are immediately redirected to the verification interface.

# 5. Functional Requirements
## 5.1 Authentication
- Shopkeeper logs in using email and password (same login page, role-based redirect)
- After successful login, role is checked: if role === 'shopkeeper', redirect to /shopkeeper
- Shopkeeper cannot navigate to any other route — all routes except /shopkeeper are blocked
- Session management via JWT token (same as existing auth system)
## 5.2 Shopkeeper Profile
- Shop name
- Shop category (cafe, hotel, restaurant, retail, other)
- Address / city
- Contact number
- Logo / profile photo (optional)
## 5.3 Coupon Verification Interface
This is the primary screen the shopkeeper sees after login.
Input
- A large, prominent text input field to enter the coupon code
- A 'Verify Code' button
Verification Response

Mark as Redeemed
- After verifying a valid code, shopkeeper taps 'Mark as Redeemed'
- Code status is updated in the database to 'redeemed'
- Timestamp and shopkeeper ID are recorded
- Confirmation animation shown to shopkeeper
## 5.4 Redemption History
- List of all codes verified by this shopkeeper
- Columns: Code, Item Name, Customer Name, Date & Time, Status
- Filter by date range
- Total redemptions count shown at top
## 5.5 Admin: Shopkeeper Management
- Admin can create shopkeeper accounts from admin panel
- Admin sets: shop name, email, password, category, address
- Admin can activate / deactivate shopkeeper accounts
- Admin can view redemption logs per shopkeeper

# 6. Non-Functional Requirements
- Verification response must appear within 2 seconds
- Portal must be mobile-responsive (shopkeepers will use phones/tablets)
- All coupon codes must be one-time use only
- Shopkeeper session should auto-expire after 8 hours of inactivity
- Portal should work offline-gracefully — show error if network unavailable

# 7. Database Changes
## 7.1 User Model — New Fields

## 7.2 Redemption Model — New Fields


# 8. API Endpoints Required


# 9. Frontend Pages


# 10. UI/UX Requirements
- Same dark green theme as the main app for brand consistency
- Verification interface should be extremely simple — one input, one button
- Success/failure states should use full-screen color overlays for instant recognition
- Large font sizes since shopkeepers may use the portal on small phone screens
- The 'Mark as Redeemed' confirmation should require a deliberate tap to prevent accidents
- Shopkeeper navbar should only show: Verify, History, Profile, Logout

# 11. User Stories
## Shopkeeper Stories
- As a shopkeeper, I want to log in with my email and password so I can access the verification portal
- As a shopkeeper, I want to enter a coupon code and instantly see if it is valid so I can provide the correct discount to the customer
- As a shopkeeper, I want to mark a valid code as redeemed so the same code cannot be used again
- As a shopkeeper, I want to see a clear error if the code is fake or already used so I can decline the request
- As a shopkeeper, I want to view my redemption history so I can track how many coupons were verified
## Admin Stories
- As an admin, I want to create shopkeeper accounts so I can onboard new partner stores
- As an admin, I want to deactivate a shopkeeper account so I can remove partners who are no longer active
- As an admin, I want to view redemption logs per shopkeeper so I can monitor coupon usage

# 12. Acceptance Criteria
- Shopkeeper login redirects to /shopkeeper and cannot access any other route
- Valid coupon code shows green success screen with item and customer details
- After marking redeemed, the same code shows 'Already Used' for any subsequent verification attempt
- Invalid code shows red error screen immediately
- Admin can create, view, and deactivate shopkeeper accounts from admin panel
- All verification actions are logged with timestamp and shopkeeper ID

# 13. Future Scope (v2+)
- QR code scanning via phone camera for faster verification
- Shopkeeper self-registration with admin approval workflow
- Multi-branch support — one account, multiple locations
- Analytics dashboard — top redeemed items, peak hours, monthly trends
- Push notifications — alert shopkeeper when a new coupon for their store is redeemed
- Shopkeeper mobile app (React Native)

# 14. Technical Implementation Notes
- Role: Add 'shopkeeper' to the existing role enum in User model (alongside user and admin)
- Auth: Existing JWT auth system handles shopkeeper login — no new auth flow needed
- Route Guard: Add ShopkeeperRoute component in React similar to existing PrivateRoute and AdminRoute
- Coupon codes are already generated in the existing store redemption flow — just need status tracking added
- Backend: New /shopkeeper/* routes with shopkeeperOnly middleware
- Frontend: New /shopkeeper/* pages, completely separate from main app pages

Stack: Node.js + Express (backend), React + Vite (frontend), MongoDB (database), same as existing platform.

Social Impact Reward App  |  Shopkeeper PRD v1.0  |  Confidential
| Role | Access Level | Description |
| --- | --- | --- |
| user | App only | Regular app users who earn and redeem coins |
| admin | Admin panel + App | Platform administrators who manage activities, store, and users |
| shopkeeper | Verification Portal only | Shop owners who verify coupon codes presented by customers |
| Status | Visual | Action |
| --- | --- | --- |
| Valid | Green checkmark screen | Show item name, user name, discount details. Show 'Mark as Redeemed' button |
| Already Used | Orange warning screen | Show when and by whom it was redeemed. No action available |
| Invalid | Red error screen | Show 'Invalid code' message. Suggest rechecking the code |
| Field | Type | Default | Description |
| --- | --- | --- | --- |
| role | Enum | user | Add 'shopkeeper' to existing enum |
| shopName | String | '' | Name of the shop |
| shopCategory | Enum | null | cafe / hotel / restaurant / retail / other |
| shopAddress | String | '' | Physical address of shop |
| isActive | Boolean | true | Admin can deactivate shopkeeper |
| Field | Type | Description |
| --- | --- | --- |
| status | Enum | pending / redeemed — default: pending |
| redeemedAt | Date | Timestamp when shopkeeper marked it redeemed |
| redeemedBy | ObjectId | Reference to shopkeeper User who verified |
| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /auth/login | Existing — returns role for redirect logic |
| GET | /shopkeeper/verify/:code | Verify coupon code authenticity |
| PUT | /shopkeeper/redeem/:code | Mark code as redeemed |
| GET | /shopkeeper/history | Get redemption history for this shopkeeper |
| GET | /shopkeeper/profile | Get shopkeeper profile |
| POST | /admin/shopkeepers | Admin: create shopkeeper account |
| GET | /admin/shopkeepers | Admin: list all shopkeepers |
| PUT | /admin/shopkeepers/:id | Admin: update / deactivate shopkeeper |
| Route | Page | Access |
| --- | --- | --- |
| /login | Login Page | Public — role-based redirect after login |
| /shopkeeper | Verification Interface | Shopkeeper only |
| /shopkeeper/history | Redemption History | Shopkeeper only |
| /shopkeeper/profile | Shop Profile | Shopkeeper only |
| /admin/shopkeepers | Manage Shopkeepers | Admin only |