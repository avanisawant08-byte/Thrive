import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.pages import HomePage, BasePage

@pytest.mark.navigation
class TestNavigation:
    """Navigation test suite covering desktop/mobile navbars, logo return, history, and links."""

    def test_logo_navigates_to_home(self, driver, base_url):
        """Clicking the logo from any inner page should return to home page."""
        driver.get(f"{base_url}/events")
        base_page = BasePage(driver, base_url)
        base_page.click_logo()

        WebDriverWait(driver, 8).until(
            lambda d: d.current_url.rstrip("/") == base_url.rstrip("/")
        )
        assert driver.current_url.rstrip("/") == base_url.rstrip("/")

    def test_desktop_navbar_routes(self, driver, base_url):
        """Desktop navbar links navigate to their corresponding target routes."""
        driver.set_window_size(1440, 900)
        driver.get(base_url)

        routes_to_test = [
            ("Events", "/events"),
            ("Find Nearby", "/map"),
            ("Donations", "/donations"),
            ("Rewards", "/reward-store"),
            ("Leaderboard", "/leaderboard"),
        ]

        for link_text, expected_path in routes_to_test:
            link_locator = (By.XPATH, f"//header//nav//a[contains(., '{link_text}')]")
            link_elem = WebDriverWait(driver, 6).until(
                EC.element_to_be_clickable(link_locator)
            )
            driver.execute_script("arguments[0].click();", link_elem)

            WebDriverWait(driver, 8).until(
                lambda d: expected_path in d.current_url
            )
            assert expected_path in driver.current_url, f"Failed navigating to {expected_path}"

    def test_mobile_bottom_nav_routes(self, driver, base_url):
        """Mobile bottom bar links navigate properly on smartphone viewports."""
        driver.set_window_size(375, 812)
        driver.get(base_url)

        # On mobile viewport, bottom nav is rendered
        mobile_bar = WebDriverWait(driver, 6).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "nav.md\\:hidden"))
        )
        assert mobile_bar.is_displayed()

        mobile_links = [
            ("Events", "/events"),
            ("Nearby", "/map"),
            ("Donate", "/donations"),
            ("Social", "/social-feed"),
            ("Wallet", "/reward-store"),
        ]

        for text, path in mobile_links:
            btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, f"//nav[contains(@class, 'md:hidden')]//a[contains(., '{text}')]"))
            )
            driver.execute_script("arguments[0].click();", btn)
            WebDriverWait(driver, 8).until(
                lambda d: path in d.current_url
            )
            assert path in driver.current_url

    def test_browser_back_and_forward(self, driver, base_url):
        """Browser back and forward history functions accurately without state corruptions."""
        driver.get(f"{base_url}/")
        WebDriverWait(driver, 8).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))

        driver.get(f"{base_url}/events")
        WebDriverWait(driver, 8).until(lambda d: "/events" in d.current_url)

        driver.get(f"{base_url}/donations")
        WebDriverWait(driver, 8).until(lambda d: "/donations" in d.current_url)

        # Go back to /events
        driver.back()
        WebDriverWait(driver, 8).until(lambda d: "/events" in d.current_url)
        assert "/events" in driver.current_url

        # Go back to /
        driver.back()
        WebDriverWait(driver, 8).until(lambda d: d.current_url.rstrip("/") == base_url.rstrip("/"))
        assert driver.current_url.rstrip("/") == base_url.rstrip("/")

        # Go forward to /events
        driver.forward()
        WebDriverWait(driver, 8).until(lambda d: "/events" in d.current_url)
        assert "/events" in driver.current_url

    def test_landing_page_cta_navigation(self, driver, base_url):
        """Landing page hero CTA buttons direct users to correct public areas."""
        home = HomePage(driver, base_url).load()
        home.click_view_marketplace()
        WebDriverWait(driver, 8).until(lambda d: "/reward-store" in d.current_url)
        assert "/reward-store" in driver.current_url

    def test_all_visible_anchor_hrefs(self, driver, base_url):
        """All visible anchor tags on home page have valid non-empty href attributes."""
        driver.get(base_url)
        WebDriverWait(driver, 8).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        anchors = driver.find_elements(By.TAG_NAME, "a")
        assert len(anchors) > 0, "No anchor tags found on page"

        visible_count = 0
        for a in anchors:
            if a.is_displayed():
                visible_count += 1
                href = a.get_attribute("href")
                # Href must exist and shouldn't be a broken link
                assert href is not None, "Visible link has no href attribute"
                assert href.strip() != "", "Visible link has an empty href"

        assert visible_count > 0, "No visible anchor tags found on page to validate"
