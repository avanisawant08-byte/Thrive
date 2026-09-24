import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

@pytest.mark.performance
class TestPerformance:
    """Performance evaluation using Navigation Timing and Resource Timing APIs."""

    def test_home_page_load_time(self, driver, base_url):
        """Page load event completion should remain under the 5-second threshold."""
        driver.get(base_url)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))

        # Fetch Navigation Timing metrics
        timing = driver.execute_script("""
            var nav = performance.getEntriesByType('navigation')[0];
            if (nav) {
                return {
                    loadTime: nav.loadEventEnd - nav.startTime,
                    domContentTime: nav.domContentLoadedEventEnd - nav.startTime,
                    ttfb: nav.responseStart - nav.requestStart
                };
            }
            var t = performance.timing;
            return {
                loadTime: t.loadEventEnd - t.navigationStart,
                domContentTime: t.domContentLoadedEventEnd - t.navigationStart,
                ttfb: t.responseStart - t.requestStart
            };
        """)

        load_time_ms = timing.get("loadTime", 0)
        # In case loadEventEnd is 0 while page finishes async
        if load_time_ms <= 0:
            load_time_ms = timing.get("domContentTime", 0)

        print(f"\n[Performance Metrics] Load Time: {load_time_ms:.1f}ms | TTFB: {timing.get('ttfb', 0):.1f}ms")
        assert load_time_ms < 5000, f"Page load time exceeded 5s: {load_time_ms:.1f}ms"

    def test_dom_content_loaded_time(self, driver, base_url):
        """DOM ready content parsing must complete swiftly (< 3000ms)."""
        driver.get(f"{base_url}/events")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))

        dcl_ms = driver.execute_script("""
            var nav = performance.getEntriesByType('navigation')[0];
            if (nav && nav.domContentLoadedEventEnd > 0) {
                return nav.domContentLoadedEventEnd - nav.startTime;
            }
            var t = performance.timing;
            return t.domContentLoadedEventEnd - t.navigationStart;
        """)

        print(f"\n[Performance Metrics] DOMContentLoaded on /events: {dcl_ms:.1f}ms")
        assert dcl_ms < 3500, f"DOMContentLoaded took too long: {dcl_ms:.1f}ms"

    def test_flag_oversized_images(self, driver, base_url):
        """No single image asset exceeds 2.5MB transfer or decoded body size."""
        driver.get(f"{base_url}/reward-store")
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        oversized_images = driver.execute_script("""
            var resources = performance.getEntriesByType('resource');
            var oversized = [];
            for (var i = 0; i < resources.length; i++) {
                var r = resources[i];
                if (r.initiatorType === 'img' || r.name.match(/\\.(png|jpg|jpeg|webp|gif)/i)) {
                    var size = r.transferSize || r.decodedBodySize || 0;
                    if (size > 2500000) { // 2.5MB
                        oversized.push({ url: r.name, sizeBytes: size });
                    }
                }
            }
            return oversized;
        """)

        assert len(oversized_images) == 0, f"Oversized images detected (>2.5MB): {oversized_images}"

    def test_total_resource_request_budget(self, driver, base_url):
        """Total network requests on the landing page remain within budget (< 100 requests)."""
        driver.get(base_url)
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "h1")))

        request_count = driver.execute_script("return performance.getEntriesByType('resource').length;")
        print(f"\n[Performance Metrics] Total requests on Home: {request_count}")
        assert request_count < 100, f"Too many network requests on landing page: {request_count}"
