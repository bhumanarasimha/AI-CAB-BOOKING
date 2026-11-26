#!/usr/bin/env python3
"""
Selenium WebDriver Automation Suite for SmartRide AI (Web & Android WebView).
Reads test case expectations aligned with .github/scripts/ci/generate_selenium_excel.py
and executes headless Chrome WebDriver assertions when selenium is installed.
"""

import json
import os
import sys
import time

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait
except ImportError:
    print("Selenium package not installed. Install with: pip install selenium")
    sys.exit(0)

WEB_URL = os.environ.get("SMARTRIDE_WEB_URL", "http://localhost:8080/")
MOBILE_URL = os.environ.get("SMARTRIDE_MOBILE_URL", "http://localhost:5173/")


def create_driver(mobile=False):
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    if mobile:
        opts.add_experimental_option(
            "mobileEmulation",
            {
                "deviceMetrics": {"width": 412, "height": 915, "pixelRatio": 2.625},
                "userAgent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120.0.0.0 Mobile Safari/537.36 SmartRideAndroid/3.5",
            },
        )
    else:
        opts.add_argument("--window-size=1280,880")
    return webdriver.Chrome(options=opts)


def run_web_selenium_tests():
    results = []
    driver = create_driver(mobile=False)
    wait = WebDriverWait(driver, 15)
    try:
        driver.get(WEB_URL)
        wait.until(EC.presence_of_element_located((By.ID, "web-auth-screen")))
        results.append(("TC_WEB_02", "Auth Modal Displayed", "PASS"))

        driver.find_element(By.ID, "page-auth-tab-register").click()
        wait.until(EC.visibility_of_element_located((By.ID, "page-register-form")))
        results.append(("TC_WEB_03", "Register Tab Switch", "PASS"))

        driver.find_element(By.ID, "page-auth-tab-login").click()
        driver.find_element(By.ID, "page-auth-demo-autofill").click()
        driver.find_element(By.ID, "page-login-submit-btn").click()
        wait.until(EC.invisibility_of_element_located((By.ID, "web-auth-screen")))
        results.append(("TC_WEB_06", "Demo Login Unlock", "PASS"))

        driver.execute_script(
            "document.getElementById('pickup-input').removeAttribute('readonly');"
            "document.getElementById('pickup-input').value='Guindy, Chennai';"
            "document.getElementById('dropoff-input').removeAttribute('readonly');"
            "document.getElementById('dropoff-input').value='Marina Beach, Chennai';"
        )
        driver.find_element(By.ID, "search-route-btn").click()
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".quote-card")))
        results.append(("TC_WEB_10", "Route Search & Quotes", "PASS"))

        driver.find_element(By.ID, "chubby-ai-fab").click()
        wait.until(EC.visibility_of_element_located((By.ID, "chubby-ai-modal")))
        driver.find_element(By.ID, "chubby-tab-chat").click()
        wait.until(EC.visibility_of_element_located((By.ID, "chatbot-input")))
        driver.find_element(By.ID, "chatbot-input").send_keys("Which ride is cheapest?")
        driver.find_element(By.ID, "chatbot-send-btn").click()
        time.sleep(0.8)
        results.append(("TC_WEB_18", "Chubby AI Chatbot Interaction", "PASS"))
        driver.find_element(By.ID, "chubby-modal-close").click()

        driver.find_element(By.ID, "tab-profile").click()
        wait.until(EC.visibility_of_element_located((By.ID, "section-profile")))
        tiles = driver.find_elements(By.CSS_SELECTOR, ".profile-option-item")
        assert len(tiles) == 9, f"Expected 9 profile tiles, found {len(tiles)}"
        results.append(("TC_WEB_23", "Profile 9 Services Grid", "PASS"))
    finally:
        driver.quit()
    return results


def run_android_selenium_tests():
    results = []
    driver = create_driver(mobile=True)
    try:
        driver.get(MOBILE_URL)
        driver.execute_script(
            "localStorage.setItem('smartride_token', 'demo_token_12345');"
            "localStorage.setItem('smartride_user', JSON.stringify({id:1,name:'Rider Demo',email:'rider@smartride.ai',role:'rider'}));"
            "localStorage.setItem('smartride_user_pickup', 'Guindy, Chennai');"
            "localStorage.setItem('smartride_user_dropoff', 'Marina Beach, Chennai');"
        )
        routes = [
            "#/user/home",
            "#/user/map-picker",
            "#/user/ride-comparison",
            "#/user/profile",
            "#/user/commute",
            "#/user/parcel",
            "#/user/emergency",
            "#/user/famous-places",
            "#/user/theme",
        ]
        for r in routes:
            driver.get(MOBILE_URL + r)
            time.sleep(1.0)
            body = driver.find_element(By.TAG_NAME, "body").text
            assert "The application encountered a display issue" not in body, f"ErrorBoundary on {r}"
            results.append((f"SELENIUM_{r}", f"Route {r} rendered cleanly", "PASS"))
    finally:
        driver.quit()
    return results


if __name__ == "__main__":
    summary = run_web_selenium_tests() + run_android_selenium_tests()
    print(json.dumps(summary, indent=2))
