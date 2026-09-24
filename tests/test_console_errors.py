import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

IGNORE_CONSOLE_PATTERNS = [
    "favicon.ico",
    "chrome-extension",
    "serviceWorker",
]

def get_severe_browser_logs(driver):
    """Retrieve SEVERE browser console log entries if supported by current WebDriver."""
    try:
        logs = driver.get_log("browser")
    except Exception:
        # Browser driver may not support get_log (e.g. Firefox geckodriver)
        return []

    severe_errors = []
    for entry in logs:
        level = entry.get("level", "")
        message = entry.get("message", "")

        # Skip ignored benign items
        if any(ignored in message for ignored in IGNORE_CONSOLE_PATTERNS):
            continue

        if level == "SEVERE":
            severe_errors.append(message)

    return severe_errors

@pytest.mark.console
class TestConsoleErrors:
    """Detect unhandled JavaScript runtime exceptions and severe browser console errors."""

    @pytest.mark.parametrize("path", ["/", "/events", "/map", "/donations", "/reward-store", "/login"])
    def test_no_severe_javascript_console_errors(self, driver, base_url, path):
        """Pages should not produce unhandled SEVERE JavaScript runtime errors or crashed scripts."""
        driver.get(f"{base_url}{path}")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        severe_errors = get_severe_browser_logs(driver)

        # Fail if unhandled exceptions or TypeError / ReferenceError / SyntaxError occurred
        critical_js_errors = [
            err for err in severe_errors
            if any(err_type in err for err_type in ["Uncaught TypeError", "Uncaught ReferenceError", "Uncaught SyntaxError"])
        ]

        assert len(critical_js_errors) == 0, f"Critical JavaScript runtime errors found on {path}: {critical_js_errors}"

    def test_no_mixed_content_security_warnings(self, driver, base_url):
        """HTTPS pages must not attempt to fetch insecure HTTP resources (Mixed Content)."""
        driver.get(base_url)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))

        try:
            logs = driver.get_log("browser")
        except Exception:
            logs = []

        mixed_content_logs = [
            entry.get("message") for entry in logs
            if "Mixed Content" in entry.get("message", "")
        ]

        assert len(mixed_content_logs) == 0, f"Mixed content security violations found: {mixed_content_logs}"
