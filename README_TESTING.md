# Thrive — UI Automation Test Suite Guide

This directory contains a complete, free, open-source automated UI test suite built with **Python 3**, **Selenium 4+**, and **pytest**.

---

## 1. Quick Start & Prerequisites

### Prerequisites
- Python 3.10+ installed
- Google Chrome or Microsoft Edge installed

### Install Dependencies
From the repository root:

```bash
pip install -r requirements.txt
```

*(All required packages: `selenium`, `pytest`, `pytest-html`, `pytest-xdist`, `webdriver-manager`, `Pillow`)*

---

## 2. Running Tests

> **Note for Windows Users:** Always run pytest with `python -m pytest` to avoid PATH resolution issues.

### Run All Tests (Headless by Default)
Runs the entire test suite and generates a self-contained HTML report:

```bash
python -m pytest -v --html=reports/report.html --self-contained-html
```

The report will be created at: `reports/report.html`.

---

### Run an Individual Test File
You can run any test module independently:

```bash
# Smoke tests (page health & essential components)
python -m pytest tests/test_smoke.py -v

# Navigation tests (links, logo, desktop & mobile navbars, history back/forward)
python -m pytest tests/test_navigation.py -v

# Forms & Inputs tests (validation, boundaries, emojis, XSS safety, Enter key)
python -m pytest tests/test_forms.py -v

# Interactive components & modals (modals, category chips, tabs, theme toggle)
python -m pytest tests/test_interactions.py -v

# Responsive design tests (mobile, tablet, laptop, desktop viewports)
python -m pytest tests/test_responsive.py -v

# Visual & layout integrity (natural image dimensions, fonts, boundaries)
python -m pytest tests/test_visual_layout.py -v

# Accessibility tests (HTML lang, image alt text, H1 hierarchy, axe-core audit)
python -m pytest tests/test_accessibility.py -v

# Performance benchmarks (Navigation timing API, TTFB, load duration < 5s)
python -m pytest tests/test_performance.py -v

# Console errors (SEVERE runtime errors and mixed content detection)
python -m pytest tests/test_console_errors.py -v

# Cross-browser tests (Chrome, Edge & Firefox compatibility)
python -m pytest tests/test_cross_browser.py -v

# Authenticated flow tests (login, logout, redirect, register form)
python -m pytest tests/test_authenticated_flows.py -v
```

### Run Authenticated Flow Tests

The `test_authenticated_flows.py` module includes two categories:

1. **Form-only tests** (always run): password toggle, tabs, empty submission, forgot-password modal, error on wrong credentials.
2. **Real-login tests** (require env vars): login redirect, token storage, auto-redirect if authenticated, logout.

To run real-login tests, supply valid test-account credentials:

```bash
# Windows PowerShell:
$env:TEST_EMAIL="your-test-user@example.com"
$env:TEST_PASSWORD="YourPassword123!"
python -m pytest tests/test_authenticated_flows.py -v

# Linux / macOS:
TEST_EMAIL="your-test-user@example.com" TEST_PASSWORD="YourPassword123!" python -m pytest tests/test_authenticated_flows.py -v
```

> **⚠️ Never hardcode credentials or commit `.env` files containing them.**

---

### Run Tests in Visible (Headed) Mode
To watch the browser window interact live on your screen:

```bash
python -m pytest tests/test_smoke.py -v --headed
```

---

### Run Tests with a Different Browser
Supported browsers: `chrome` (default), `edge`, `firefox`.

```bash
# Run with Microsoft Edge
python -m pytest tests/test_smoke.py -v --browser-name=edge

# Run with Mozilla Firefox
python -m pytest tests/test_smoke.py -v --browser-name=firefox
```

---

### Change the Test Target URL
By default, tests point to the live Vercel deployment: `https://thrive-rose.vercel.app/`.

You can test local development servers or staging environments in two ways:

#### Option A: Using the CLI Flag
```bash
python -m pytest -v --site-url=http://localhost:5173
```

#### Option B: Using an Environment Variable
```bash
# Windows PowerShell:
$env:BASE_URL="http://localhost:5173"
python -m pytest -v

# Linux / macOS:
export BASE_URL="http://localhost:5173"
python -m pytest -v
```

---

## 3. Reports & Failure Screenshots

- **HTML Report:** Every execution configured with `--html=reports/report.html --self-contained-html` generates an interactive report in `reports/report.html`.
- **Automatic Failure Screenshots:** Whenever a test fails, `conftest.py` immediately takes a full-viewport screenshot into `screenshots/` and embeds it directly into the HTML report for instant debugging.
- **Responsive Snapshots:** Viewport tests save device-specific renders directly into `screenshots/responsive/` (covering 375x812, 768x1024, 1440x900, 1920x1080).

---

## 4. Test Suite Architecture (Page Object Model)

The suite is organized following standard industry Page Object Model (POM) best practices:

```
tests/
├── conftest.py               # Driver fixture, CLI options, screenshot-on-failure hook
├── pages/                    # Page Object Model abstractions
│   ├── base_page.py          # Core navigation, explicit waits, locators & helpers
│   ├── home_page.py          # Hero landing page (/)
│   ├── login_page.py         # Login & Register forms (/login, /register)
│   ├── events_page.py        # Events list & EventDetail modal (/events)
│   ├── map_page.py           # Find Nearby leaflet map (/map)
│   ├── social_page.py        # Social community feed (/social-feed)
│   ├── donations_page.py     # Donation Center (/donations)
│   ├── rewards_page.py       # Reward Marketplace (/reward-store)
│   └── leaderboard_page.py   # Global Rankings (/leaderboard)
├── test_smoke.py             # Route health, titles, 404 resilience
├── test_navigation.py        # Navbar, footer, logo link, history back/forward
├── test_forms.py             # HTML5 validation, XSS sanitization, boundaries
├── test_interactions.py      # Modals, category filters, theme toggle
├── test_responsive.py        # 4 device viewports, scrollWidth check
├── test_visual_layout.py     # Image natural dimensions, fonts, element bounds
├── test_accessibility.py     # Alt tags, labels, H1 count, axe-core audit
├── test_performance.py       # Load timing, DOMContentLoaded, oversized assets
├── test_console_errors.py    # Unhandled SEVERE JS exceptions, mixed content
├── test_cross_browser.py     # Multi-browser cross validation (Chrome, Edge & Firefox)
└── test_authenticated_flows.py # Login, logout, redirect, register form validation
```

---

## 5. Continuous Integration (GitHub Actions)

A zero-config CI pipeline is located at `.github/workflows/ui-tests.yml`. On every push and pull request, it runs the full test suite in headless Chrome and uploads the HTML report and screenshots as downloadable workflow artifacts.
