from selenium.webdriver.common.by import By
from .base_page import BasePage

class EventsPage(BasePage):
    """Page Object for Events List & Detail Modal (/events)."""

    H1_TITLE = (By.TAG_NAME, "h1")
    CREATE_EVENT_BUTTON = (By.XPATH, "//button[contains(., 'Create Event')]")
    CATEGORY_CHIPS = (By.CSS_SELECTOR, "div.scrollbar-hide button")
    SORT_CONTAINER = (By.XPATH, "//div[contains(@class, 'relative') and .//button[.//span[text()='sort']]]")
    EVENT_CARDS = (By.CSS_SELECTOR, "div.glass-card.group")
    VIEW_DETAILS_BUTTONS = (By.XPATH, "//button[contains(., 'View Details')]")
    HOST_EVENT_BENTO = (By.XPATH, "//h3[contains(., 'Host Your Own Event?')]")

    # EventDetail Modal Locators
    DETAIL_MODAL = (By.XPATH, "//div[contains(@class, 'fixed') and .//span[text()='close']]")
    DETAIL_CLOSE_BUTTON = (By.XPATH, "//div[contains(@class, 'fixed')]//button[.//span[text()='close']]")
    DETAIL_BACK_BUTTON = (By.XPATH, "//div[contains(@class, 'fixed')]//button[.//span[text()='arrow_back']]")
    DETAIL_TITLE = (By.CSS_SELECTOR, "div.fixed.inset-0 h2")
    DETAIL_JOIN_BUTTON = (By.XPATH, "//div[contains(@class, 'fixed')]//button[contains(., 'Join This Event') or contains(., 'Already Joined') or contains(., 'Event Completed')]")

    def load(self):
        return self.navigate_to("/events")

    def get_event_cards(self):
        return self.find_all(self.EVENT_CARDS)

    def filter_by_category(self, category_name):
        category_btn = (By.XPATH, f"//div[contains(@class, 'scrollbar-hide')]//button[normalize-space()='{category_name}']")
        self.click(category_btn)

    def open_first_event_detail(self):
        self.click(self.VIEW_DETAILS_BUTTONS)

    def is_detail_modal_open(self):
        return self.is_visible(self.DETAIL_MODAL, timeout=3)

    def get_detail_modal_title(self):
        return self.get_text(self.DETAIL_TITLE)

    def close_detail_modal(self):
        self.click(self.DETAIL_CLOSE_BUTTON)

    def click_modal_back_button(self):
        self.click(self.DETAIL_BACK_BUTTON)
