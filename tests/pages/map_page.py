from selenium.webdriver.common.by import By
from .base_page import BasePage

class MapPage(BasePage):
    """Page Object for Interactive Map & Nearby Activities (/map)."""

    H1_TITLE = (By.TAG_NAME, "h1")
    MAP_CONTAINER = (By.CSS_SELECTOR, "div.leaflet-container")
    EVENTS_TOGGLE = (By.XPATH, "//button[normalize-space()='Events']")
    ACTIVITIES_TOGGLE = (By.XPATH, "//button[normalize-space()='Activities']")
    CATEGORY_SELECT = (By.XPATH, "//div[.//label[contains(text(), 'Category')]]//select")
    STATUS_SELECT = (By.XPATH, "//div[.//label[contains(text(), 'Status')]]//select")
    DISTANCE_SLIDER = (By.CSS_SELECTOR, "input[type='range']")
    RECENTER_BUTTON = (By.XPATH, "//button[contains(., 'RE-CENTER')]")
    MARKERS = (By.CSS_SELECTOR, ".leaflet-marker-icon")

    def load(self):
        return self.navigate_to("/map")

    def is_map_rendered(self):
        return self.is_visible(self.MAP_CONTAINER, timeout=5)

    def switch_to_activities(self):
        self.click(self.ACTIVITIES_TOGGLE)

    def switch_to_events(self):
        self.click(self.EVENTS_TOGGLE)

    def select_category(self, cat_value):
        sel_elem = self.find_visible(self.CATEGORY_SELECT)
        sel_elem.click()
        option = (By.XPATH, f"//div[.//label[contains(text(), 'Category')]]//select/option[@value='{cat_value}']")
        self.click(option)

    def click_recenter(self):
        self.click(self.RECENTER_BUTTON)
