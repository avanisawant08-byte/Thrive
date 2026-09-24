# Bugs Found in Thrive Web Application (Live Deployment)

**Target URL:** `https://thrive-rose.vercel.app/`  
**Test Suite:** Selenium 4 + pytest UI Automation  
**Date of Testing:** September 2026  

---

## Summary of Findings

During automated UI testing and exploratory verification of the live deployed site, several real functional, visual, and accessibility defects were identified. These issues have been isolated from test code bugs and are documented below with reproduction steps, actual vs. expected behavior, and screenshot evidence.

---

### Bug 1: Broken NGO Banner Image on Donation Center Page

- **Severity:** Medium (Visual / Content Integrity)
- **URL Affected:** `https://thrive-rose.vercel.app/donations`
- **Failing Test:** `tests/test_visual_layout.py::TestVisualLayout::test_images_loaded_not_broken[/donations]`
- **Screenshot Path:** `screenshots/FAIL_test_images_loaded_not_broken__donations__*.png`

#### Steps to Reproduce
1. Open Chrome or Edge and navigate to `https://thrive-rose.vercel.app/donations`.
2. Inspect the NGO card for organization **"pr ngo"**.
3. Observe the banner image container or inspect the DOM element `<img>`.

#### Actual Result
The image points to an invalid/non-existent Cloudinary asset URL (`https://res.cloudinary.com/dkpzibtkx/image/upload/v1776667685/social-impact/proo...`) which fails HTTP resolution and has `naturalWidth == 0`. The user sees a broken image icon.

#### Expected Result
All NGO banner cards should either resolve valid CDN media or fall back immediately to an SVG/CSS default graphic via an `onError` fallback handler.

---

### Bug 2: Missing Semantic `<h1>` Heading on Social Feed Page

- **Severity:** Low / Medium (Accessibility WCAG 2.1 A & SEO)
- **URL Affected:** `https://thrive-rose.vercel.app/social-feed`
- **Failing Test:** Identified in `tests/test_accessibility.py` / `TEST_PLAN.md`
- **Screenshot Path:** `screenshots/FAIL_test_social_feed_page_loads_*.png`

#### Steps to Reproduce
1. Navigate to `https://thrive-rose.vercel.app/social-feed`.
2. Open DevTools or execute `document.querySelectorAll('h1').length`.

#### Actual Result
Returns `0`. The page has no `<h1>` heading anywhere in the DOM.

#### Expected Result
Every distinct page/route must include exactly one `<h1>` heading to establish semantic hierarchy for screen readers and search crawlers (e.g., `<h1 className="sr-only">Thrive Community Feed</h1>` or a visible title).

---

### Bug 3: Missing Back Navigation in EventDetail Modal on Live Site

- **Severity:** High (Mobile UX & Navigation)
- **URL Affected:** `https://thrive-rose.vercel.app/events`
- **Failing Test:** `tests/test_interactions.py::TestInteractions::test_event_detail_modal_back_arrow_dismiss`
- **Screenshot Path:** `screenshots/FAIL_test_event_detail_modal_back_arrow_dismiss_20260924_193332.png`

#### Steps to Reproduce
1. Navigate to `https://thrive-rose.vercel.app/events`.
2. Click **"View Details"** on any event card (e.g. "eveeent").
3. Inspect the top bar of the modal.

#### Actual Result
The deployed modal on Vercel contains only a small close button (`close`), and lacks an accessible top back arrow button (`arrow_back`). If a user on mobile taps their Android hardware/browser back button, the modal does not dismiss cleanly; instead the browser navigates away from `/events` or triggers redirect issues.

#### Expected Result
The modal should feature both an explicit back arrow button and a browser `popstate` history listener so pressing "Back" simply closes the modal without unmounting or redirecting away from the Events catalog.

---

### Bug 4: Missing Fallback 404 "Page Not Found" Route

- **Severity:** Medium (UX & Routing)
- **URL Affected:** `https://thrive-rose.vercel.app/non-existent-route-check`
- **Component:** `App.jsx`

#### Steps to Reproduce
1. Navigate to `https://thrive-rose.vercel.app/any-random-url-not-in-routes`.
2. Observe page contents.

#### Actual Result
The application shell (Background + Navbar) renders, but the main content area remains completely blank with no message or indication of an invalid URL.

#### Expected Result
React Router should render a dedicated 404 page (e.g., `<Route path="*" element={<NotFoundPage />} />`) with a helpful error message and a button directing users back to `/` or `/events`.

---

### Bug 5: Missing Accessible Labels / Title on Live Social Feed Tabs

- **Severity:** Low (Accessibility)
- **URL Affected:** `https://thrive-rose.vercel.app/social-feed`
- **Component:** `SocialFeed.jsx`

#### Steps to Reproduce
1. Navigate to `https://thrive-rose.vercel.app/social-feed`.
2. Inspect the four segment tab buttons (`For You`, `Following`, `NGO Missions`, `Discover`).

#### Actual Result
On the deployed build, each tab button has an empty `title=""` and the icons are rendered as plain text ligature spans (`auto_awesome`, `group`, etc.) without `aria-label`.

#### Expected Result
Tab buttons should have descriptive `aria-label` or populated `title` attributes so assistive technologies can announce their purpose clearly.
