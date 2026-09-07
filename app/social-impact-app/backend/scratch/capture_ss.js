const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SS_DIR = path.join(__dirname, '../../ss');
const ROOT_SS_DIR = path.join(__dirname, '../../../../ss');
const APP_URL = 'http://localhost:5173';

const MOCK_USERS = {
  unauthenticated: null,
  user: {
    _id: 'mock_user_1',
    name: 'Jane Doe',
    email: 'user@example.com',
    role: 'user',
    coinBalance: 450,
  },
  ngo: {
    _id: 'mock_ngo_1',
    name: 'Green Earth Foundation',
    email: 'ngo@example.com',
    role: 'ngo',
    coinBalance: 1200,
  },
  admin: {
    _id: 'mock_admin_1',
    name: 'System Admin',
    email: 'admin@example.com',
    role: 'admin',
  },
  shopkeeper: {
    _id: 'mock_shop_1',
    name: 'Eco Goods Store',
    email: 'shop@example.com',
    role: 'shopkeeper',
  }
};

const ROUTES = [
  { path: '/', name: '01_landing_page', role: 'unauthenticated' },
  { path: '/login', name: '02_login_page', role: 'unauthenticated' },
  { path: '/register', name: '03_sign_up_page', role: 'unauthenticated' },
  { path: '/dashboard', name: '04_dashboard', role: 'user' },
  { path: '/map', name: '05_maps', role: 'user' },
  { path: '/events', name: '06_events', role: 'user' },
  { path: '/social-feed', name: '07_social_feed', role: 'user' },
  { path: '/reward-store', name: '08_reward_store', role: 'user' },
  { path: '/leaderboard', name: '09_leaderboard', role: 'user' },
  { path: '/donations', name: '10_donations', role: 'user' },
  { path: '/profile', name: '11_user_profile', role: 'user' },
  { path: '/edit-profile', name: '12_edit_profile', role: 'user' },
  { path: '/apply-ngo', name: '13_apply_ngo', role: 'user' },
  { path: '/ngo-command', name: '14_ngo_command_dashboard', role: 'ngo' },
  { path: '/admin', name: '20_admin_dashboard', role: 'admin' },
  { path: '/admin/ngo-approvals', name: '21_admin_ngo_approvals', role: 'admin' },
  { path: '/admin/event-approvals', name: '22_admin_event_approvals', role: 'admin' },
  { path: '/admin/shop-verification', name: '23_admin_shop_verification', role: 'admin' },
  { path: '/admin/activities', name: '24_admin_activities', role: 'admin' },
  { path: '/shopkeeper', name: '25_shopkeeper_dashboard', role: 'shopkeeper' }
];

async function captureAllScreenshots() {
  // Ensure target directories exist
  if (!fs.existsSync(SS_DIR)) {
    fs.mkdirSync(SS_DIR, { recursive: true });
  }
  if (!fs.existsSync(ROOT_SS_DIR)) {
    fs.mkdirSync(ROOT_SS_DIR, { recursive: true });
  }

  console.log('🚀 Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  const themes = ['light', 'dark'];

  for (const theme of themes) {
    console.log(`\n========================================`);
    console.log(`📸 Capturing ${theme.toUpperCase()} theme screenshots`);
    console.log(`========================================`);

    for (const route of ROUTES) {
      console.log(`\n----------------------------------------`);
      console.log(`Setting up state for ${route.name} (${route.path}) [Theme: ${theme}]...`);
      
      // Go to app root to prime localStorage state
      await page.goto(APP_URL, { waitUntil: 'networkidle2' });

      await page.evaluate(({ user, theme, role }) => {
        localStorage.clear();
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        if (user) {
          localStorage.setItem('token', `mock_${role}_token`);
          localStorage.setItem('user', JSON.stringify(user));
        }
      }, { user: MOCK_USERS[route.role], theme, role: route.role });

      console.log(`Navigating to ${APP_URL}${route.path}...`);
      await page.goto(`${APP_URL}${route.path}`, { waitUntil: 'networkidle0', timeout: 30000 });

      // Apply theme to html element directly in DOM to guarantee theme styling
      await page.evaluate((theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, theme);

      // Wait for splash loader to disappear
      try {
        await page.waitForFunction(() => {
          return !document.body.innerText.includes('Loading Experience...');
        }, { timeout: 8000 });
      } catch (e) {
        // Fall through
      }

      // Wait for network requests, maps, fonts, and dynamic animations to settle (4.5 seconds)
      console.log(`⏳ Waiting for screen content to fully load and settle...`);
      await new Promise(resolve => setTimeout(resolve, 4500));

      const fileName = `${theme}_${route.name}.png`;
      const targetPathPrimary = path.join(SS_DIR, fileName);
      const targetPathRoot = path.join(ROOT_SS_DIR, fileName);

      console.log(`📷 Capturing screenshot -> ${fileName}`);
      await page.screenshot({ path: targetPathPrimary, fullPage: true });

      // Copy to root ss directory as well
      fs.copyFileSync(targetPathPrimary, targetPathRoot);
      console.log(`✅ Saved to both app/social-impact-app/ss and SOCIAL-APP/ss`);
    }
  }

  console.log('\nClosing browser...');
  await browser.close();
  console.log('\n🎉 ALL SCREENSHOTS CAPTURED SUCCESSFULLY IN BOTH LIGHT & DARK THEMES!');
}

captureAllScreenshots().catch(err => {
  console.error('❌ Error during screenshot generation:', err);
  process.exit(1);
});
