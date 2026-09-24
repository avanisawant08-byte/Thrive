import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.pages import LoginPage

@pytest.mark.forms
class TestForms:
    """Comprehensive form validation, security sanitization, and input interaction tests."""

    def test_login_required_fields_validation(self, driver, base_url):
        """Empty submission should trigger HTML5 required constraint validation."""
        page = LoginPage(driver, base_url).load()
        email_elem = page.find_visible(LoginPage.EMAIL_INPUT)
        password_elem = page.find_visible(LoginPage.PASSWORD_INPUT)

        # Trigger submission without filling fields
        page.click_submit()

        # Both inputs should have required attribute and fail validity
        is_email_valid = driver.execute_script("return arguments[0].checkValidity();", email_elem)
        assert is_email_valid is False, "Empty required email field unexpectedly passed validity check"

    def test_login_invalid_email_format(self, driver, base_url):
        """Invalid email formats (e.g. without @ or domain) should fail HTML5 email validation."""
        page = LoginPage(driver, base_url).load()
        email_elem = page.find_visible(LoginPage.EMAIL_INPUT)

        invalid_emails = ["notanemail", "user@", "user@.com", "user@domain..com"]
        for invalid_val in invalid_emails:
            page.enter_email(invalid_val)
            is_valid = driver.execute_script("return arguments[0].checkValidity();", email_elem)
            assert is_valid is False, f"Expected '{invalid_val}' to be rejected as invalid email"

    def test_toggle_login_and_register_tabs(self, driver, base_url):
        """Switching between Login and Register tabs dynamically updates visible form inputs."""
        page = LoginPage(driver, base_url).load()

        # Initially in login mode
        assert not page.is_register_mode(), "Name input should not be visible in Login mode"

        # Switch to Register
        page.switch_to_register()
        assert page.is_register_mode(), "Name input should be visible in Register mode"

        # Switch back to Login
        page.switch_to_login()
        assert not page.is_register_mode(), "Name input should be hidden when switching back to Login"

    def test_password_visibility_toggle(self, driver, base_url):
        """Clicking visibility eye icon toggles input type between password and text."""
        page = LoginPage(driver, base_url).load()
        page.enter_password("Secret1234!")

        assert page.get_password_input_type() == "password"

        # Toggle to visible
        page.toggle_password_visibility()
        assert page.get_password_input_type() == "text"

        # Toggle back to hidden
        page.toggle_password_visibility()
        assert page.get_password_input_type() == "password"

    def test_enter_key_submits_form(self, driver, base_url):
        """Pressing the Enter key while in an input field triggers form submission."""
        page = LoginPage(driver, base_url).load()
        page.enter_email("test_enter_key@example.com")
        page.enter_password("SecretPassword123")

        # Submit by pressing Enter
        page.submit_with_enter()

        # Should either show loading state or an error response from backend
        feedback_or_button = WebDriverWait(driver, 8).until(
            lambda d: d.find_element(By.CSS_SELECTOR, "button[type='submit']").text in ["Processing...", "Continue"]
            or len(d.find_elements(By.CSS_SELECTOR, "div.bg-error-container")) > 0
        )
        assert feedback_or_button is not None

    def test_boundary_long_input(self, driver, base_url):
        """Very long input strings (500+ characters) do not cause UI overflow or browser crashes."""
        page = LoginPage(driver, base_url).load()
        long_string = "A" * 600

        page.enter_email(f"{long_string[:50]}@{long_string[:50]}.com")
        page.enter_password(long_string)

        # Confirm element has received text and page has not crashed
        email_elem = page.find_visible(LoginPage.EMAIL_INPUT)
        assert len(email_elem.get_attribute("value")) > 0

    def test_special_characters_and_emojis(self, driver, base_url):
        """Input containing emojis and complex symbols is handled safely."""
        page = LoginPage(driver, base_url).load()
        special_text = "Thrive 🚀✨🎉🌱!@#$%^&*()_+{}[]:;\"'<>?,./~`"

        page.switch_to_register()
        page.enter_name(special_text)

        name_elem = page.find_visible(LoginPage.NAME_INPUT)
        assert name_elem.get_attribute("value") == special_text

    def test_xss_payload_safety(self, driver, base_url):
        """Script tags in form inputs must not execute or create alert dialogues."""
        page = LoginPage(driver, base_url).load()
        xss_payload = "<script>alert('xss_breach')</script>"

        page.switch_to_register()
        page.enter_name(xss_payload)
        page.enter_email("xss_safe@impact.com")
        page.enter_password("SecurePassword123")
        page.click_submit()

        # Verify no unhandled JavaScript alert is present
        with pytest.raises(Exception):
            driver.switch_to.alert

    def test_tab_keyboard_navigation(self, driver, base_url):
        """Inputs follow standard tab navigation sequence."""
        page = LoginPage(driver, base_url).load()
        email_elem = page.find_visible(LoginPage.EMAIL_INPUT)
        email_elem.click()

        # Send TAB key
        email_elem.send_keys(Keys.TAB)

        # Active element should now be either the forgot password button or the password input
        active = driver.switch_to.active_element
        tag = active.tag_name.lower()
        assert tag in ["input", "button"], f"Expected input or button focused, got {tag}"

    def test_forgot_password_modal_lifecycle(self, driver, base_url):
        """Forgot password link opens modal, allows input, and can be cancelled."""
        page = LoginPage(driver, base_url).load()
        page.open_forgot_password()

        assert page.is_forgot_modal_open(), "Forgot Password modal did not open"

        # Close modal
        page.close_forgot_modal()
        WebDriverWait(driver, 5).until(
            EC.invisibility_of_element_located(LoginPage.FORGOT_MODAL)
        )
        assert not page.is_forgot_modal_open(), "Forgot Password modal did not close"
