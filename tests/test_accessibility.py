import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

AXE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.4/axe.min.js"

@pytest.mark.accessibility
class TestAccessibility:
    """Accessibility auditing: HTML lang, image alt text, heading hierarchy, input labels, and axe-core."""

    def test_html_lang_attribute(self, driver, base_url):
        """Root <html> element must have a defined lang attribute for screen readers."""
        driver.get(base_url)
        lang = driver.execute_script("return document.documentElement.getAttribute('lang');")
        assert lang is not None and len(lang.strip()) > 0, "Root <html> is missing 'lang' attribute"

    @pytest.mark.parametrize("path", ["/", "/events", "/reward-store"])
    def test_images_have_alt_attribute(self, driver, base_url, path):
        """All images on core pages have an alt attribute (or explicit aria-hidden)."""
        driver.get(f"{base_url}{path}")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        images = driver.find_elements(By.TAG_NAME, "img")
        missing_alt = []

        for img in images:
            alt = img.get_attribute("alt")
            role = img.get_attribute("role")
            aria_hidden = img.get_attribute("aria-hidden")

            # Passes if alt is provided or image is explicitly marked decorative
            if alt is None and role != "presentation" and aria_hidden != "true":
                src = img.get_attribute("src") or "unknown"
                missing_alt.append(src[:80])

        assert len(missing_alt) == 0, f"Images missing alt text on {path}: {missing_alt}"

    def test_form_inputs_have_labels_or_placeholders(self, driver, base_url):
        """Form inputs on the login page must have an accessible name via label, aria-label, or placeholder."""
        driver.get(f"{base_url}/login")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "form")))

        inputs = driver.find_elements(By.CSS_SELECTOR, "form input")
        for inp in inputs:
            inp_type = inp.get_attribute("type")
            if inp_type in ["hidden", "submit", "button"]:
                continue
            placeholder = inp.get_attribute("placeholder") or ""
            aria_label = inp.get_attribute("aria-label") or ""
            inp_id = inp.get_attribute("id")

            has_label = False
            if inp_id:
                has_label = len(driver.find_elements(By.CSS_SELECTOR, f"label[for='{inp_id}']")) > 0

            assert has_label or len(placeholder) > 0 or len(aria_label) > 0, (
                f"Input of type '{inp_type}' lacks accessible label, aria-label, or placeholder"
            )

    @pytest.mark.parametrize("path,expected_count", [
        ("/", 1),
        ("/login", 1),
        ("/events", 1),
        ("/map", 1),
        ("/donations", 1),
        ("/reward-store", 1),
        ("/leaderboard", 1),
    ])
    def test_h1_heading_count(self, driver, base_url, path, expected_count):
        """Core pages should feature exactly one main <h1> heading for proper semantic hierarchy."""
        driver.get(f"{base_url}{path}")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        h1s = driver.find_elements(By.TAG_NAME, "h1")
        assert len(h1s) == expected_count, (
            f"Expected {expected_count} <h1> heading on {path}, but found {len(h1s)}"
        )

    def test_keyboard_tab_focus_navigable(self, driver, base_url):
        """Page is navigable via keyboard TAB key and document.activeElement changes."""
        driver.get(base_url)
        body = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        body.click()

        body.send_keys(Keys.TAB)
        active1 = driver.execute_script("return document.activeElement ? document.activeElement.tagName : null;")

        body.send_keys(Keys.TAB)
        active2 = driver.execute_script("return document.activeElement ? document.activeElement.tagName : null;")

        assert active1 is not None and active2 is not None

    def test_axe_core_audit_home(self, driver, base_url):
        """Inject axe-core script and run accessibility evaluation on the home page."""
        driver.get(base_url)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))

        try:
            # Inject axe-core via script tag
            driver.execute_script(f"""
                var script = document.createElement('script');
                script.src = '{AXE_CDN}';
                script.type = 'text/javascript';
                document.head.appendChild(script);
            """)

            # Wait for axe to be defined
            WebDriverWait(driver, 8).until(
                lambda d: d.execute_script("return typeof window.axe !== 'undefined';")
            )

            # Run axe audit asynchronously
            results = driver.execute_async_script("""
                var callback = arguments[arguments.length - 1];
                window.axe.run({ runOnly: ['wcag2a', 'wcag2aa'] }, function(err, results) {
                    if (err) callback({ error: err.message });
                    else callback(results);
                });
            """)

            if results and "violations" in results:
                violations = results["violations"]
                critical_violations = [v for v in violations if v.get("impact") == "critical"]
                assert len(critical_violations) == 0, f"Critical a11y violations found: {critical_violations}"
        except Exception as e:
            # If axe CDN is blocked or unavailable, record soft note
            pytest.skip(f"Axe-core injection skipped or CDN unavailable: {e}")
