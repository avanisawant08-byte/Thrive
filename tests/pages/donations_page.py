from selenium.webdriver.common.by import By
from .base_page import BasePage

class DonationsPage(BasePage):
    """Page Object for Donation Center (/donations)."""

    H1_TITLE = (By.TAG_NAME, "h1")
    TAB_EXPLORE = (By.XPATH, "//button[contains(text(), 'Explore NGOs')]")
    TAB_MY_CONTRIBUTIONS = (By.XPATH, "//button[contains(text(), 'My Contributions')]")
    CATEGORY_TAGS = (By.XPATH, "//button[contains(@class, 'rounded-full') and (contains(text(), 'All NGOs') or contains(text(), 'Education') or contains(text(), 'Health'))]")
    NGO_CARDS = (By.CSS_SELECTOR, "div.grid.grid-cols-1 > div")

    def load(self):
        return self.navigate_to("/donations")

    def filter_by_category(self, category_name):
        btn = (By.XPATH, f"//button[contains(@class, 'rounded-full') and contains(text(), '{category_name}')]")
        self.click(btn)

    def switch_to_my_contributions(self):
        self.click(self.TAB_MY_CONTRIBUTIONS)

    def switch_to_explore(self):
        self.click(self.TAB_EXPLORE)
