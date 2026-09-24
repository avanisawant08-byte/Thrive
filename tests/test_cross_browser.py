import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

SUPPORTED_BROWSERS = ["chrome", "edge"]

def create_driver(browser_name):
    """Instantiate a headless browser driver for cross-browser testing."""
    if browser_name == "chrome":
        options = ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1440,900")
        return webdriver.Chrome(options=options)

    elif browser_name == "edge":
        try:
            options = EdgeOptions()
            options.add_argument("--headless=new")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--window-size=1440,900")
            return webdriver.Edge(options=options)
        except Exception as e:
            pytest.skip(f"Edge driver not available on this environment: {e}")

    elif browser_name == "firefox":
        try:
            options = FirefoxOptions()
            options.add_argument("-headless")
            options.add_argument("--width=1440")
            options.add_argument("--height=900")
            return webdriver.Firefox(options=options)
        except Exception as e:
            pytest.skip(f"Firefox driver not available on this environment: {e}")

    raise ValueError(f"Unknown browser: {browser_name}")

@pytest.mark.cross_browser
class TestCrossBrowser:
    """Validate core smoke, navigation, and layout consistency across multiple browsers."""

    @pytest.mark.parametrize("browser_name", SUPPORTED_BROWSERS)
    def test_cross_browser_home_page(self, base_url, browser_name):
        """Home page loads with complete heading, title, and interactive buttons on target browser."""
        driver = create_driver(browser_name)
        try:
            driver.get(base_url)
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
            assert "Thrive" in driver.title
            h1 = driver.find_element(By.TAG_NAME, "h1").text
            assert "Do Good" in h1 or "THRIVE" in h1.upper()
            cta = driver.find_element(By.XPATH, "//button[contains(., 'Start Making Impact')]")
            assert cta.is_displayed()
        finally:
            driver.quit()

    @pytest.mark.parametrize("browser_name", SUPPORTED_BROWSERS)
    def test_cross_browser_events_page(self, base_url, browser_name):
        """Events page renders catalog and category chips consistently across browsers."""
        driver = create_driver(browser_name)
        try:
            driver.get(f"{base_url}/events")
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
            h1 = driver.find_element(By.TAG_NAME, "h1").text
            assert "Events" in h1
            chips = driver.find_elements(By.CSS_SELECTOR, "div.scrollbar-hide button")
            assert len(chips) >= 3
        finally:
            driver.quit()

    @pytest.mark.parametrize("browser_name", SUPPORTED_BROWSERS)
    def test_cross_browser_responsive_layout(self, base_url, browser_name):
        """Mobile viewport has no horizontal overflow on target browser."""
        driver = create_driver(browser_name)
        try:
            driver.set_window_size(375, 812)
            driver.get(base_url)
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

            scroll_w = driver.execute_script("return document.documentElement.scrollWidth")
            inner_w = driver.execute_script("return window.innerWidth")
            assert scroll_w <= inner_w + 2, f"Horizontal scroll detected on {browser_name}"
        finally:
            driver.quit()
