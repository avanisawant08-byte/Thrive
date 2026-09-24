from selenium.webdriver.common.by import By
from .base_page import BasePage

class HomePage(BasePage):
    """Page Object for Home / Hero Landing Page (/)."""

    H1_TITLE = (By.TAG_NAME, "h1")
    HERO_SUBTITLE = (By.CSS_SELECTOR, "section p")
    START_IMPACT_BUTTON = (By.XPATH, "//button[contains(., 'Start Making Impact')]")
    VIEW_MARKETPLACE_LINK = (By.XPATH, "//a[contains(., 'View Marketplace')]")
    STATS_CONTAINER = (By.CSS_SELECTOR, "div.grid")
    SIGN_IN_HEADER_BUTTON = (By.XPATH, "//header//a[contains(., 'Sign In')]")

    def load(self):
        return self.navigate_to("/")

    def get_heading_text(self):
        return self.get_text(self.H1_TITLE)

    def click_start_making_impact(self):
        self.click(self.START_IMPACT_BUTTON)

    def click_view_marketplace(self):
        self.click(self.VIEW_MARKETPLACE_LINK)

    def click_header_sign_in(self):
        self.click(self.SIGN_IN_HEADER_BUTTON)
