import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BasePage:
    """Base Page Object class containing common navigation, waits, and DOM interactions."""

    def __init__(self, driver, base_url=""):
        self.driver = driver
        self.base_url = base_url.rstrip("/")
        self.timeout = 15

    def navigate_to(self, path=""):
        target_url = f"{self.base_url}{path}" if path.startswith("/") else f"{self.base_url}/{path}"
        self.driver.get(target_url)
        self.wait_for_page_ready(15)
        return self

    def wait_for_page_ready(self, timeout=15):
        WebDriverWait(self.driver, timeout).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )

    def find(self, locator, timeout=None):
        t = timeout or self.timeout
        return WebDriverWait(self.driver, t).until(
            EC.presence_of_element_located(locator)
        )

    def find_visible(self, locator, timeout=None):
        t = timeout or self.timeout
        return WebDriverWait(self.driver, t).until(
            EC.visibility_of_element_located(locator)
        )

    def find_all(self, locator):
        return self.driver.find_elements(*locator)

    def click(self, locator, timeout=None):
        t = timeout or self.timeout
        element = WebDriverWait(self.driver, t).until(
            EC.element_to_be_clickable(locator)
        )
        try:
            element.click()
        except Exception:
            # Fallback to JavaScript click if overlapping animation or sticky header intervenes
            self.driver.execute_script("arguments[0].click();", element)

    def send_keys(self, locator, text, clear_first=True, timeout=None):
        elem = self.find_visible(locator, timeout)
        if clear_first:
            elem.clear()
        elem.send_keys(text)

    def get_text(self, locator, timeout=None):
        return self.find_visible(locator, timeout).text

    def get_title(self):
        return self.driver.title

    def get_current_url(self):
        return self.driver.current_url

    def is_visible(self, locator, timeout=8):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located(locator)
            )
            return True
        except Exception:
            return False

    def is_present(self, locator, timeout=8):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located(locator)
            )
            return True
        except Exception:
            return False

    def scroll_into_view(self, element):
        self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});", element)

    def take_screenshot(self, filename):
        screenshots_dir = os.path.join(os.getcwd(), "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        path = os.path.join(screenshots_dir, filename)
        self.driver.save_screenshot(path)
        return path

    # Common Header and Theme components
    LOGO = (By.XPATH, "//header//a[contains(., 'THRIVE')]")
    THEME_TOGGLE = (By.CSS_SELECTOR, "header button[title*='Theme']")
    NAV_LINKS = (By.CSS_SELECTOR, "header nav a")
    MOBILE_BOTTOM_NAV = (By.CSS_SELECTOR, "nav.md\\:hidden")

    def click_logo(self):
        self.click(self.LOGO)

    def toggle_theme(self):
        self.click(self.THEME_TOGGLE)

    def is_dark_mode(self):
        html_classes = self.driver.find_element(By.TAG_NAME, "html").get_attribute("class") or ""
        return "dark" in html_classes
