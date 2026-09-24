from selenium.webdriver.common.by import By
from .base_page import BasePage

class RewardsPage(BasePage):
    """Page Object for Reward Store / Marketplace (/reward-store)."""

    H1_TITLE = (By.TAG_NAME, "h1")
    CATEGORY_PILLS = (By.CSS_SELECTOR, "section.mb-12 button")
    REWARD_CARDS = (By.CSS_SELECTOR, "div.glass-card.group, div.glass-card")
    REDEEM_BUTTONS = (By.XPATH, "//button[contains(., 'Redeem')]")

    def load(self):
        return self.navigate_to("/reward-store")

    def filter_by_category(self, category_name):
        btn = (By.XPATH, f"//section[contains(@class, 'mb-12')]//button[contains(text(), '{category_name}')]")
        self.click(btn)

    def get_reward_cards(self):
        return self.find_all(self.REWARD_CARDS)
