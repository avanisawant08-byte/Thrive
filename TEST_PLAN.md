# Comprehensive UI Test Plan — Thrive Web Application

**Target URL:** `https://thrive-rose.vercel.app/` (Default, configurable via `BASE_URL`)  
**Source Code Workspace:** `d:\WORK\Thrive-main\Thrive-main`  
**Tooling:** Python 3.14+, Selenium 4.49+, pytest 9.1+, pytest-html, WebDriverManager, Pillow  

---

## 1. Executive Summary & Site Inventory

Thrive is a modern web application connecting community volunteering and social impact with rewards. Built with React (Vite) and TailwindCSS, the application features glassmorphism, responsive navigation (desktop sticky header and mobile bottom navbar), and dynamic state-driven interactions.

### Route & Page Inventory

| Route | Page Component | Public / Protected | Key UI Elements |
|---|---|---|---|
| `/` | `HeroLanding` | Public | Hero heading, CTAs ("Get Started", "Explore Events"), Value propositions, Featured stats |
| `/login` | `Login` | Public | Tab toggle (Login / Register), Email, Password, Continue button, Google Login, Forgot Password modal, Back button |
| `/register` | `Login` (Register) | Public | Tab toggle, Full Name, Email, Password, Register CTA, Google Auth |
| `/events` | `Events` | Public | Category filters (All, Blood Donation, Tree Plant, Beach Clean, Food Drive, Education), Sort dropdown, Event cards, "View Details", "Create Event" CTA, Bento Host CTA |
| `/map` | `MapPage` | Public | Leaflet map container, location search input, filters, event/activity markers, info sidebar, "View Details" CTA |
| `/social-feed` | `SocialFeed` | Public / User | Stories spotlight row, "Share Story" CTA, Segmented tab bar (`For You`, `Following`, `NGO Missions`, `Discover`), Feed cards, Reactions, Comments, Bookmarks |
| `/dashboard` | `Dashboard` | Protected (auth token) | Stat tiles, impact points, upcoming events, recent activities, "Log Activity" button |
| `/donations` | `Donations` | Public | NGO donation cards, cause badges, target bars, "Donate Now" buttons, Donation modal |
| `/reward-store`| `RewardStore` | Public | Category pills, reward cards, cost badges, "Redeem" buttons, Coupon code modal |
| `/leaderboard` | `Leaderboard` | Public | Top 3 podium, ranking list, time filters (Weekly, Monthly, All-time), coin balances |
| `/profile` | `UserProfile` | Protected (auth token) | Profile header, impact level, badges, activity history, "Edit Profile" link |
| `/edit-profile`| `EditProfile` | Protected (auth token) | Form inputs (name, bio, links, avatar), Save button |
| `/apply-ngo` | `ApplyNGO` | User Protected | Multi-step registration form for NGO organizations |
| `/ngo-command` | `NGOCommandCenter` | Role Protected (NGO) | NGO mission management, volunteer tracking, analytics |
| `/shopkeeper` | `ShopkeeperDashboard` | Role Protected (Shopkeeper)| Coupon validation scanner, redemption history, coupon generator |
| `/admin/*` | `AdminDashboard` | Role Protected (Admin) | Admin stats, NGO approvals, Event approvals, Activities management |

---

## 2. Interactive Components & Modals Inventory

1. **Header Navigation (Desktop):**
   - Brand Logo ("THRIVE") -> navigates to `/`
   - Primary links: Dashboard, Find Nearby, Events, Donations, Impact, Rewards, Leaderboard
   - Theme toggle button (Dark / Light mode)
   - Notifications dropdown panel
   - Auth buttons: "Sign In" (guests) or User Avatar & Logout (logged-in users)

2. **Bottom Navigation (Mobile):**
   - Home (`/` for guests, `/dashboard` for users)
   - Events (`/events`)
   - Nearby (`/map`)
   - Donate (`/donations`)
   - Social (`/social-feed`)
   - Wallet (`/reward-store`)

3. **Modals & Overlays:**
   - **EventDetail Modal:** Opened from Events, Map, or Dashboard. Contains event banner, back arrow, close button, category pill, status badge, title, reward token badge, meta details (date, time, location, duration), volunteer progress bar, description, organizer card, and footer CTA ("Join This Event" / "Cancel Event"). Supports Android hardware back button via popstate.
   - **CreateEvent Modal:** Multi-step event creation wizard.
   - **LogActivityModal:** Form for submitting volunteer proofs.
   - **UserProfileModal:** Changemaker popup card.
   - **Donation Modal:** Amount selector and payment trigger.
   - **Redeem Coupon Modal:** Displays voucher code and expiry.
   - **Forgot Password Modal:** In `/login`, submits password reset request.

---

## 3. Test Coverage Strategy

### Test Suites to Implement

```
tests/
  ├── conftest.py             # Reusable fixtures, CLI options, hooks, failure screenshots
  ├── pages/                  # Page Object Model (POM) abstractions
  │   ├── base_page.py
  │   ├── home_page.py
  │   ├── login_page.py
  │   ├── events_page.py
  │   ├── map_page.py
  │   ├── social_page.py
  │   ├── donations_page.py
  │   ├── rewards_page.py
  │   └── leaderboard_page.py
  ├── test_smoke.py           # Page health, HTTP responses, titles, essential elements
  ├── test_navigation.py      # Navbar, footer, logo link, history back/forward, deep links
  ├── test_forms.py           # Login/Register, required fields, invalid input, XSS safety, Enter key
  ├── test_interactions.py    # Modals open/close, category tabs, filter dropdowns, theme toggle
  ├── test_responsive.py      # Viewport tests (375x812, 768x1024, 1440x900, 1920x1080), horizontal scroll
  ├── test_visual_layout.py   # Image loading, naturalWidth check, font fallback, element alignment
  ├── test_accessibility.py   # Image alts, input labels, single H1, html lang, keyboard focus
  ├── test_performance.py     # Navigation timing API, load duration under 5s, asset size check
  ├── test_console_errors.py  # Browser console SEVERE errors and unhandled exceptions
  └── test_cross_browser.py   # Multi-browser compatibility (Chrome, Edge, Firefox)
```

---

## 4. Test Case Checklist

### 1. Smoke & Page Load (`test_smoke.py`)
- [ ] Verify Home landing page loads without error and displays title containing "Thrive".
- [ ] Verify Login page loads, displaying form container and title.
- [ ] Verify Events page loads with H1 "Events".
- [ ] Verify Map page loads with Leaflet map container.
- [ ] Verify Social Feed page loads without crashing.
- [ ] Verify Donations page loads with H1 "Donation Center".
- [ ] Verify Reward Store page loads with H1 "Store 🛍️".
- [ ] Verify Leaderboard page loads with H1 "LEADERBOARD".
- [ ] Verify non-existent route `/random-404-check` renders gracefully (not a blank screen).

### 2. Navigation & Routing (`test_navigation.py`)
- [ ] Verify clicking desktop Logo from any route navigates back to `/`.
- [ ] Verify desktop navbar links navigate to corresponding routes.
- [ ] Verify mobile bottom navbar links navigate to Events, Map, Donations, Social, and Rewards.
- [ ] Verify guest clicking mobile "Home" navigates to `/` (does not redirect to `/login`).
- [ ] Verify browser Back and Forward navigation operates seamlessly.
- [ ] Verify all external links have valid URLs and open with `rel="noopener noreferrer"`.
- [ ] Scan all visible `<a>` links on public pages for broken targets (HTTP 404/500).

### 3. Forms & Inputs (`test_forms.py`)
- [ ] Verify Login form shows required validation when submitted empty.
- [ ] Verify invalid email format (e.g., `invalid-email-address`) triggers HTML5 or app validation.
- [ ] Verify toggle between Login and Register modes switches inputs (Full Name appears on Register).
- [ ] Verify password visibility toggle shows and hides password text.
- [ ] Verify boundary input: very long strings (500+ chars) do not break layout.
- [ ] Verify special characters and emojis (`🚀🎉!@#$%^&*()_+`) handle safely without crash.
- [ ] Verify XSS test payload (`<script>alert(1)</script>`) is safely sanitized and not executed.
- [ ] Verify keyboard Enter key submits the active form.
- [ ] Verify "Forgot Password" modal opens, validates email, and closes cleanly.
- [ ] Verify Login card "Back" button navigates back to previous page or home.

### 4. Interactive Components & Modals (`test_interactions.py`)
- [ ] Verify Dark/Light mode theme toggle alters `<html>` class (`dark` added or removed).
- [ ] Verify Events page category filters change active styling and filter cards.
- [ ] Verify Events page sort dropdown opens and updates selection.
- [ ] Verify clicking an Event card opens the `EventDetail` modal.
- [ ] Verify `EventDetail` modal displays back button, close button, banner, and footer CTA.
- [ ] Verify clicking `EventDetail` close button (`X`) dismisses the modal.
- [ ] Verify clicking `EventDetail` back arrow dismisses the modal without navigating to `/login`.
- [ ] Verify pressing browser/hardware back button while `EventDetail` is open closes the modal.
- [ ] Verify Social Feed tab bar buttons switch tabs (`For You`, `Following`, `NGO Missions`, `Discover`).
- [ ] Verify Reward Store category filter buttons update active state.

### 5. Responsive Design (`test_responsive.py`)
- [ ] Test viewports:
  - Mobile: `375 x 812` (iPhone X/12/13/14)
  - Tablet: `768 x 1024` (iPad)
  - Laptop: `1440 x 900`
  - Desktop: `1920 x 1080` (Full HD)
- [ ] Verify no horizontal scrollbar (`document.documentElement.scrollWidth <= window.innerWidth`) on any viewport.
- [ ] Verify mobile bottom navigation bar is visible only on viewports `< 768px`.
- [ ] Verify desktop header nav links are hidden on mobile and visible on desktop.
- [ ] Verify `EventDetail` modal sits above the mobile bottom navbar with full footer CTA visibility.
- [ ] Capture and save responsive screenshots for each viewport in `screenshots/responsive/`.

### 6. Visual & Asset Integrity (`test_visual_layout.py`)
- [ ] Verify all visible images have `naturalWidth > 0` (no broken image icons).
- [ ] Verify fallback images activate for missing/broken remote image URLs.
- [ ] Verify typography loads Google Fonts / system fonts cleanly.
- [ ] Verify critical UI containers stay within viewport boundaries.

### 7. Accessibility Baseline (`test_accessibility.py`)
- [ ] Verify `<html>` tag has a valid `lang` attribute.
- [ ] Verify page has a sensible heading structure (H1 presence, hierarchy).
- [ ] Verify all `<img>` tags possess `alt` attributes.
- [ ] Verify form input elements have corresponding labels or `aria-label`/placeholder.
- [ ] Verify keyboard tab navigation moves focus sequentially through interactive elements.

### 8. Performance Basics (`test_performance.py`)
- [ ] Verify Navigation Timing: page load time (`loadEventEnd - navigationStart`) is under 5 seconds.
- [ ] Verify DOMContentLoaded is under 3 seconds.
- [ ] Flag pages with excessive total DOM element count (> 2,500 elements).

### 9. Console Errors & Logs (`test_console_errors.py`)
- [ ] Capture Chrome browser console logs via `driver.get_log("browser")`.
- [ ] Assert zero `SEVERE` unhandled JavaScript runtime exceptions on all core pages.
- [ ] Report warnings and 404 resource request failures.

### 10. Cross-Browser Execution (`test_cross_browser.py`)
- [ ] Parametrized test execution supporting Chrome and Edge (and Firefox if present).
- [ ] Verify headless mode runs cleanly for CI/CD environments.

---

## 5. Execution & Reporting Requirements
- Standard command: `python -m pytest -v --html=reports/report.html --self-contained-html`
- Failures automatically capture timestamped screenshots to `screenshots/`.
- All genuine defects identified during execution will be documented in `BUGS_FOUND.md`.
