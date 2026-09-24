from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from .base_page import BasePage

class LoginPage(BasePage):
    """Page Object for Authentication (/login and /register)."""

    H1_TITLE = (By.TAG_NAME, "h1")
    LOGIN_TAB = (By.XPATH, "//button[text()='Login']")
    REGISTER_TAB = (By.XPATH, "//button[text()='Register']")
    NAME_INPUT = (By.CSS_SELECTOR, "input[placeholder='John Doe']")
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password'], input[placeholder='••••••••']")
    PASSWORD_VISIBILITY_TOGGLE = (By.XPATH, "//button[.//span[contains(text(), 'visibility')]]")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")
    FORGOT_PASSWORD_LINK = (By.XPATH, "//button[contains(text(), 'Forgot?')]")
    FORGOT_MODAL = (By.XPATH, "//div[contains(@class, 'fixed') and .//h3[contains(text(), 'Reset Password')]]")
    FORGOT_EMAIL_INPUT = (By.XPATH, "//div[contains(@class, 'fixed')]//input[@type='email']")
    FORGOT_SEND_BUTTON = (By.XPATH, "//div[contains(@class, 'fixed')]//button[contains(., 'Send Reset Link')]")
    FORGOT_CANCEL_BUTTON = (By.XPATH, "//div[contains(@class, 'fixed')]//button[contains(., 'Cancel')]")
    FORGOT_FEEDBACK = (By.XPATH, "//div[contains(@class, 'fixed')]//div[contains(@class, 'rounded-2xl')]")
    BACK_BUTTON = (By.XPATH, "//button[contains(., 'Back')]")
    ERROR_ALERT = (By.CSS_SELECTOR, "div.bg-error-container")

    def load(self):
        return self.navigate_to("/login")

    def load_register(self):
        return self.navigate_to("/register")

    def switch_to_login(self):
        self.click(self.LOGIN_TAB)

    def switch_to_register(self):
        self.click(self.REGISTER_TAB)

    def is_register_mode(self):
        return self.is_visible(self.NAME_INPUT, timeout=2)

    def enter_name(self, name):
        self.send_keys(self.NAME_INPUT, name)

    def enter_email(self, email):
        self.send_keys(self.EMAIL_INPUT, email)

    def enter_password(self, password):
        self.send_keys(self.PASSWORD_INPUT, password)

    def click_submit(self):
        self.click(self.SUBMIT_BUTTON)

    def submit_with_enter(self):
        pwd_elem = self.find_visible(self.PASSWORD_INPUT)
        pwd_elem.send_keys(Keys.ENTER)

    def toggle_password_visibility(self):
        self.click(self.PASSWORD_VISIBILITY_TOGGLE)

    def get_password_input_type(self):
        pwd_elem = self.find(self.PASSWORD_INPUT)
        return pwd_elem.get_attribute("type")

    def open_forgot_password(self):
        self.click(self.FORGOT_PASSWORD_LINK)

    def is_forgot_modal_open(self):
        return self.is_visible(self.FORGOT_MODAL, timeout=3)

    def close_forgot_modal(self):
        self.click(self.FORGOT_CANCEL_BUTTON)

    def send_forgot_reset(self, email=""):
        if email:
            self.send_keys(self.FORGOT_EMAIL_INPUT, email)
        self.click(self.FORGOT_SEND_BUTTON)

    def click_back_button(self):
        self.click(self.BACK_BUTTON)
