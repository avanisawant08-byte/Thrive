from selenium.webdriver.common.by import By
from .base_page import BasePage

class LeaderboardPage(BasePage):
    """Page Object for Leaderboard (/leaderboard)."""

    H1_TITLE = (By.TAG_NAME, "h1")
    PODIUM_CONTAINER = (By.CSS_SELECTOR, "div.grid-cols-3")
    RANK_ROWS = (By.CSS_SELECTOR, "div.divide-y > div")

    def load(self):
        return self.navigate_to("/leaderboard")

    def is_podium_visible(self):
        return self.is_visible(self.PODIUM_CONTAINER, timeout=4)

    def get_rank_count(self):
        return len(self.find_all(self.RANK_ROWS))
