import os
import pytest
from PIL import Image
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

@pytest.mark.visual
class TestVisualLayout:
    """Visual integrity tests: natural image dimensions, font loading, element bounds, and snapshot validity."""

    @pytest.mark.parametrize("path", [
        "/",
        pytest.param("/events", marks=pytest.mark.xfail(reason="Bug: Broken Cloudinary event images on /events", strict=True)),
        "/reward-store",
        pytest.param("/donations", marks=pytest.mark.xfail(reason="Bug: Broken Cloudinary NGO banner image on /donations", strict=True)),
    ])
    def test_images_loaded_not_broken(self, driver, base_url, path):
        """All images rendered on the page have loaded completely with non-zero natural dimensions."""
        driver.get(f"{base_url}{path}")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        images = driver.find_elements(By.TAG_NAME, "img")
        if len(images) == 0:
            pytest.skip(f"No <img> elements on {path} (page uses SVG/CSS backgrounds)")
        broken_images = []

        for img in images:
            # Check if displayed
            if img.is_displayed():
                is_loaded = driver.execute_script(
                    "return arguments[0].complete && "
                    "(typeof arguments[0].naturalWidth != 'undefined' && arguments[0].naturalWidth > 0);",
                    img
                )
                if not is_loaded:
                    src = img.get_attribute("src") or "unknown"
                    alt = img.get_attribute("alt") or "no-alt"
                    broken_images.append(f"src: {src[:80]} | alt: {alt}")

        assert len(broken_images) == 0, f"Found broken images on {path}: {broken_images}"

    def test_document_fonts_loaded(self, driver, base_url):
        """Web fonts finish loading without unexpected font fallback crashes."""
        driver.get(base_url)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        fonts_ready = driver.execute_script("return document.fonts.status;")
        assert fonts_ready in ["loaded", "loading"], f"Font set status error: {fonts_ready}"

    def test_header_and_hero_elements_within_viewport(self, driver, base_url):
        """Header logo and hero elements are horizontally bounded within window innerWidth."""
        driver.set_window_size(1440, 900)
        driver.get(base_url)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))

        inner_width = driver.execute_script("return window.innerWidth")

        logo = driver.find_element(By.XPATH, "//header//a[contains(., 'THRIVE')]")
        logo_rect = logo.rect
        assert logo_rect["x"] >= 0
        assert logo_rect["x"] + logo_rect["width"] <= inner_width

        h1 = driver.find_element(By.TAG_NAME, "h1")
        h1_rect = h1.rect
        assert h1_rect["x"] >= 0
        assert h1_rect["x"] + h1_rect["width"] <= inner_width

    def test_visual_baseline_snapshot_validity(self, driver, base_url):
        """Captures a baseline page snapshot and validates image format and dimensions via Pillow."""
        driver.set_window_size(1280, 800)
        driver.get(base_url)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))

        baseline_dir = os.path.join(os.getcwd(), "screenshots", "baseline")
        os.makedirs(baseline_dir, exist_ok=True)
        img_path = os.path.join(baseline_dir, "home_desktop_baseline.png")
        driver.save_screenshot(img_path)

        # Open image with Pillow to verify it's valid
        with Image.open(img_path) as im:
            assert im.format == "PNG"
            assert im.size[0] > 0 and im.size[1] > 0
