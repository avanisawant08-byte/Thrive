const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/v1/auth/login';
const OUT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function loginAndGetState(email, password) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.token) {
    return {
      token: data.token,
      user: JSON.stringify(data.user)
    };
  }
  console.error(`Login failed for ${email}:`, data);
  return null;
}

async function main() {
  console.log('🚀 Authenticating test accounts...');
  const userAuth = await loginAndGetState('user@test.com', 'password123');
  const ngoAuth = await loginAndGetState('ngo@test.com', 'password123');
  const shopAuth = await loginAndGetState('shop@test.com', 'password123');

  console.log('🌐 Launching headless browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  async function setLocalStorage(authObj) {
    await page.evaluate(({ token, user }) => {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
      if (user) localStorage.setItem('user', user);
      else localStorage.removeItem('user');
    }, authObj || { token: null, user: null });
  }

  async function capture(url, filename, authObj = null, customActions = null) {
    console.log(`📸 Capturing: ${filename} (${url})...`);
    await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await setLocalStorage(authObj);
    await page.goto(BASE_URL + url, { waitUntil: 'networkidle0' });

    // Wait for the 3s splash screen & React animations
    await new Promise(r => setTimeout(r, 3800));

    if (customActions) {
      await customActions(page);
      await new Promise(r => setTimeout(r, 1000));
    }

    const filepath = path.join(OUT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`   Saved: ${filepath}`);
  }

  try {
    // 1. Unauthenticated Pages
    await capture('/', '01_hero_landing.png');
    await capture('/login', '02_login.png');
    await capture('/register', '03_register.png');

    // 2. User Pages (logged in as user@test.com)
    await capture('/events', '04_events.png', userAuth);
    await capture('/map', '05_map.png', userAuth);
    await capture('/dashboard', '06_dashboard.png', userAuth);
    await capture('/social-feed', '07_social_feed.png', userAuth);
    await capture('/reward-store', '08_reward_store.png', userAuth);
    await capture('/leaderboard', '09_leaderboard.png', userAuth);
    await capture('/donations', '10_donations.png', userAuth);
    await capture('/profile', '11_user_profile.png', userAuth);
    await capture('/edit-profile', '12_edit_profile.png', userAuth);
    await capture('/apply-ngo', '13_apply_ngo.png', userAuth);

    // 3. NGO Command Center Pages & Tabs (logged in as ngo@test.com)
    await capture('/ngo-command', '14_ngo_command_dashboard.png', ngoAuth);

    const ngoTabs = [
      { name: '15_ngo_command_verification.png', selector: 'button:has-text("Verification")', text: 'Verification' },
      { name: '16_ngo_command_volunteers.png', text: 'Volunteers' },
      { name: '17_ngo_command_donations.png', text: 'Donations' },
      { name: '18_ngo_command_social.png', text: 'Social' },
      { name: '19_ngo_command_analytics.png', text: 'Analytics' },
    ];

    for (const tab of ngoTabs) {
      await capture('/ngo-command', tab.name, ngoAuth, async (pg) => {
        await pg.evaluate((tabText) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.textContent.includes(tabText));
          if (btn) btn.click();
        }, tab.text);
      });
    }

    // 4. Admin Pages
    await capture('/admin', '20_admin_dashboard.png', userAuth);
    await capture('/admin/ngo-approvals', '21_admin_ngo_approvals.png', userAuth);
    await capture('/admin/event-approvals', '22_admin_event_approvals.png', userAuth);
    await capture('/admin/shop-verification', '23_admin_shop_verification.png', userAuth);
    await capture('/admin/activities', '24_admin_activities.png', userAuth);

    // 5. Shopkeeper Dashboard (logged in as shop@test.com)
    await capture('/shopkeeper', '25_shopkeeper_dashboard.png', shopAuth);

    console.log('✅ All screenshots captured successfully!');
  } catch (err) {
    console.error('❌ Error capturing screenshots:', err);
  } finally {
    await browser.close();
  }
}

main();
