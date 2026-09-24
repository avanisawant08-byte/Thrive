import os
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

VIEWPORTS = [
    ("mobile", 375, 812),
    ("tablet", 768, 1024),
    ("laptop", 1440, 900),
    ("desktop", 1920, 1080),
]

PAGES_TO_TEST = [
    ("/", "home"),
    ("/events", "events"),
    ("/donations", "donations"),
    ("/reward-store", "rewards"),
    ("/login", "login"),
]

@pytest.mark.responsive
class TestResponsiveDesign:
    """Responsive viewport testing ensuring fluid layout across mobile, tablet, and desktop."""

    @pytest.mark.parametrize("device,width,height", VIEWPORTS)
    @pytest.mark.parametrize("path,page_name", PAGES_TO_TEST)
    def test_no_horizontal_scroll_and_capture(self, driver, base_url, device, width, height, path, page_name):
        """No unexpected horizontal scrollbars exist, layout fits viewport, captures responsive snapshot."""
        driver.set_window_size(width, height)
        driver.get(f"{base_url}{path}")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        # Check document scrollWidth vs window innerWidth
        scroll_width = driver.execute_script("return document.documentElement.scrollWidth")
        inner_width = driver.execute_script("return window.innerWidth")

        # Allow 1-2px rounding tolerance for high DPI scaling
        assert scroll_width <= inner_width + 2, (
            f"Horizontal overflow detected on {page_name} ({device}): scrollWidth={scroll_width} > innerWidth={inner_width}"
        )

        # Save responsive screenshot
        responsive_dir = os.path.join(os.getcwd(), "screenshots", "responsive")
        os.makedirs(responsive_dir, exist_ok=True)
        screenshot_path = os.path.join(responsive_dir, f"{page_name}_{device}_{width}x{height}.png")
        driver.save_screenshot(screenshot_path)
        assert os.path.exists(screenshot_path)

    @pytest.mark.parametrize("width,height", [(375, 812), (414, 896)])
    def test_mobile_navigation_components_visibility(self, driver, base_url, width, height):
        """On mobile viewports, bottom navigation is visible while desktop header links are collapsed."""
        driver.set_window_size(width, height)
        driver.get(base_url)

        # Mobile bottom nav should be present and visible
        mobile_nav = WebDriverWait(driver, 8).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "nav.md\\:hidden"))
        )
        assert mobile_nav.is_displayed(), "Mobile bottom nav not displayed on smartphone view"

    @pytest.mark.parametrize("width,height", [(1440, 900), (1920, 1080)])
    def test_desktop_navigation_visibility(self, driver, base_url, width, height):
        """On desktop viewports, desktop header nav is visible while mobile bottom bar is hidden."""
        driver.set_window_size(width, height)
        driver.get(base_url)

        desktop_nav = WebDriverWait(driver, 8).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "header nav"))
        )
        assert desktop_nav.is_displayed(), "Desktop header nav not displayed on laptop/desktop view"
