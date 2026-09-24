import os
import time
import pytest
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions

DEFAULT_BASE_URL = os.getenv("BASE_URL", "https://thrive-rose.vercel.app").rstrip("/")

def pytest_addoption(parser):
    parser.addoption(
        "--browser-name",
        action="store",
        default="chrome",
        help="Browser to run tests with: chrome, edge, firefox"
    )
    parser.addoption(
        "--headless",
        action="store_true",
        default=True,
        help="Run browser in headless mode"
    )
    parser.addoption(
        "--headed",
        dest="headless",
        action="store_false",
        help="Run browser in visible (headed) mode"
    )
    parser.addoption(
        "--site-url",
        action="store",
        default=DEFAULT_BASE_URL,
        help="Base URL of application under test"
    )

@pytest.fixture(scope="session")
def base_url(request):
    url = request.config.getoption("--site-url") or DEFAULT_BASE_URL
    return url.rstrip("/")

@pytest.fixture
def driver(request, base_url):
    browser_name = request.config.getoption("--browser-name").lower()
    is_headless = request.config.getoption("--headless")

    driver_instance = None

    if browser_name == "chrome":
        options = ChromeOptions()
        if is_headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1440,900")
        options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
        driver_instance = webdriver.Chrome(options=options)

    elif browser_name == "edge":
        options = EdgeOptions()
        if is_headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1440,900")
        options.set_capability("ms:loggingPrefs", {"browser": "ALL"})
        driver_instance = webdriver.Edge(options=options)

    elif browser_name == "firefox":
        options = FirefoxOptions()
        if is_headless:
            options.add_argument("-headless")
        options.add_argument("--width=1440")
        options.add_argument("--height=900")
        driver_instance = webdriver.Firefox(options=options)

    else:
        raise ValueError(f"Unsupported browser: {browser_name}")

    driver_instance.implicitly_wait(4)

    # Attach driver to class or function item for failure screenshot hook
    if request.node:
        request.node.driver = driver_instance

    yield driver_instance

    try:
        driver_instance.quit()
    except Exception:
        pass

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()

    if report.when == "call" and report.failed:
        driver_instance = getattr(item, "driver", None)
        if not driver_instance and hasattr(item, "instance") and hasattr(item.instance, "driver"):
            driver_instance = item.instance.driver

        if driver_instance:
            screenshots_dir = os.path.join(os.getcwd(), "screenshots")
            os.makedirs(screenshots_dir, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            sanitized_name = item.name.replace("[", "_").replace("]", "_").replace("/", "_")
            screenshot_path = os.path.join(screenshots_dir, f"FAIL_{sanitized_name}_{timestamp}.png")
            try:
                driver_instance.save_screenshot(screenshot_path)
                # Attach to pytest-html if available
                pytest_html = item.config.pluginmanager.getplugin("html")
                if pytest_html is not None:
                    extra = getattr(report, "extra", [])
                    extra.append(pytest_html.extras.image(screenshot_path))
                    report.extra = extra
            except Exception as e:
                print(f"Failed to capture screenshot on failure: {e}")
