from selenium.webdriver.common.by import By
from .base_page import BasePage

class SocialPage(BasePage):
    """Page Object for Social Impact Feed (/social-feed)."""

    H1_TITLE = (By.TAG_NAME, "h1")
    TAB_FOR_YOU = (By.XPATH, "//button[contains(., 'FOR YOU') or contains(., 'For You')]")
    TAB_FOLLOWING = (By.XPATH, "//button[contains(., 'FOLLOWING') or contains(., 'Following')]")
    TAB_NGO = (By.XPATH, "//button[contains(., 'NGO') or contains(., 'Missions')]")
    TAB_DISCOVER = (By.XPATH, "//button[contains(., 'DISCOVER') or contains(., 'Discover')]")
    STORIES_CONTAINER = (By.XPATH, "//span[contains(text(), 'Share Story')]/ancestor::section")
    FEED_CONTAINER = (By.CSS_SELECTOR, "div.lg\\:col-span-8")
    SHARE_STORY_TRIGGER = (By.XPATH, "//span[contains(text(), 'Share Story')]")

    def load(self):
        return self.navigate_to("/social-feed")

    def switch_tab(self, tab_name):
        tabs = {
            "for_you": self.TAB_FOR_YOU,
            "following": self.TAB_FOLLOWING,
            "ngo": self.TAB_NGO,
            "discover": self.TAB_DISCOVER,
        }
        if tab_name in tabs:
            self.click(tabs[tab_name])

    def is_stories_bar_visible(self):
        return self.is_visible(self.SHARE_STORY_TRIGGER, timeout=10)
