import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.pages import (
    HomePage,
    LoginPage,
    EventsPage,
    MapPage,
    SocialPage,
    DonationsPage,
    RewardsPage,
    LeaderboardPage,
)

@pytest.mark.smoke
class TestSmoke:
    """Smoke test suite validating core page loads and baseline DOM readiness."""

    def test_home_page_loads(self, driver, base_url):
        page = HomePage(driver, base_url).load()
        assert "Thrive" in page.get_title(), f"Unexpected title: {page.get_title()}"
        h1_text = page.get_heading_text()
        assert "Do Good" in h1_text or "THRIVE" in h1_text.upper()
        assert page.is_visible(HomePage.LOGO)
        assert page.is_visible(HomePage.START_IMPACT_BUTTON)

    def test_login_page_loads(self, driver, base_url):
        page = LoginPage(driver, base_url).load()
        assert page.is_visible(LoginPage.H1_TITLE)
        assert page.is_visible(LoginPage.EMAIL_INPUT)
        assert page.is_visible(LoginPage.PASSWORD_INPUT)
        assert page.is_visible(LoginPage.SUBMIT_BUTTON)

    def test_events_page_loads(self, driver, base_url):
        page = EventsPage(driver, base_url).load()
        assert page.is_visible(EventsPage.H1_TITLE)
        h1 = page.get_text(EventsPage.H1_TITLE)
        assert "Events" in h1
        assert page.is_visible(EventsPage.CREATE_EVENT_BUTTON)
        chips = page.find_all(EventsPage.CATEGORY_CHIPS)
        assert len(chips) >= 3, f"Expected category chips, found {len(chips)}"

    def test_map_page_loads(self, driver, base_url):
        page = MapPage(driver, base_url).load()
        assert page.is_visible(MapPage.H1_TITLE)
        assert "Find Nearby" in page.get_text(MapPage.H1_TITLE)
        assert page.is_map_rendered()

    def test_social_feed_page_loads(self, driver, base_url):
        page = SocialPage(driver, base_url).load()
        assert page.is_visible(SocialPage.TAB_FOR_YOU)
        assert page.is_visible(SocialPage.TAB_DISCOVER)
        assert page.is_stories_bar_visible()

    def test_donations_page_loads(self, driver, base_url):
        page = DonationsPage(driver, base_url).load()
        assert page.is_visible(DonationsPage.H1_TITLE)
        assert "Donation Center" in page.get_text(DonationsPage.H1_TITLE)
        assert page.is_visible(DonationsPage.TAB_EXPLORE)

    def test_reward_store_page_loads(self, driver, base_url):
        page = RewardsPage(driver, base_url).load()
        assert page.is_visible(RewardsPage.H1_TITLE)
        assert "Store" in page.get_text(RewardsPage.H1_TITLE)
        cards = page.get_reward_cards()
        assert len(cards) >= 1, "Expected reward cards to be rendered"

    def test_leaderboard_page_loads(self, driver, base_url):
        page = LeaderboardPage(driver, base_url).load()
        assert page.is_visible(LeaderboardPage.H1_TITLE)
        assert "LEADERBOARD" in page.get_text(LeaderboardPage.H1_TITLE).upper()
        assert page.is_podium_visible()

    def test_favicon_present(self, driver, base_url):
        driver.get(base_url)
        favicons = driver.find_elements(By.CSS_SELECTOR, "link[rel*='icon']")
        assert len(favicons) > 0, "No favicon link element found in head"
        href = favicons[0].get_attribute("href")
        assert href and len(href) > 0, "Favicon href attribute is empty"

    @pytest.mark.xfail(reason="Bug: Unknown URLs render a blank container instead of a dedicated 404 page", strict=True)
    def test_unknown_url_renders_404_page(self, driver, base_url):
        """Routing to an unknown URL should present a dedicated 404 error page / message."""
        driver.get(f"{base_url}/non-existent-page-404-test")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        body_text = driver.find_element(By.TAG_NAME, "body").text
        headings = [h.text.lower() for h in driver.find_elements(By.CSS_SELECTOR, "h1, h2, h3")]
        has_404_heading = any("404" in h or "not found" in h for h in headings)
        has_404_text = "404" in body_text or "page not found" in body_text.lower()

        assert has_404_heading or has_404_text, (
            "Unknown URL renders blank container without 404 / Page Not Found message or heading"
        )
