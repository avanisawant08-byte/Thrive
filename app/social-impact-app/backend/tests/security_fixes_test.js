const assert = require('assert');

// Mock response creator
function createMockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.data = body;
      return this;
    }
  };
}

async function runTests() {
  console.log('🛡️ Running Untrusted User Attack & Bug Fix Verification Suite...\n');

  // Test 1: Production Auth Bypass via mock_ token
  {
    console.log('1. Testing mock_ token bypass in production...');
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { protect } = require('../middleware/authMiddleware');
    const req = {
      headers: { authorization: 'Bearer mock_admin' }
    };
    const res = createMockRes();
    let nextCalled = false;

    await protect(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false, 'Next should not be called with mock_ token in production');
    assert.strictEqual(res.statusCode, 401, 'Should reject mock_ token in production with 401');
    console.log('   ✅ Attack blocked: mock_ token rejected in production with 401');

    process.env.NODE_ENV = originalEnv;
  }

  // Test 2: Account Takeover via invalid idToken in loginUser
  {
    console.log('2. Testing Account Takeover exploit with invalid idToken...');
    const { loginUser } = require('../controllers/authController');
    const req = {
      body: {
        email: 'user@example.com',
        password: 'wrong_password_attempt',
        idToken: 'malicious_fake_token_attempting_takeover'
      }
    };
    const res = createMockRes();

    // User.findOne will mock find a user with different password
    const User = require('../models/User');
    const origFindOne = User.findOne;
    User.findOne = async () => ({
      _id: '650000000000000000000002',
      email: 'user@example.com',
      matchPassword: async () => false,
      save: async () => { throw new Error('SHOULD NOT SAVE NEW PASSWORD!'); }
    });

    await loginUser(req, res);

    assert.strictEqual(res.statusCode, 400, 'Should return 400 for bad password even with fake idToken');
    assert.strictEqual(res.data.message, 'Invalid email or password');
    console.log('   ✅ Attack blocked: Account takeover prevented, returned 400');
    User.findOne = origFindOne;
  }

  // Test 3: Negative / Non-Integer Coins Injection in Activity Approval
  {
    console.log('3. Testing Coin Balance Drain / Infinite Coin Injection in Activity Approval...');
    const { updateActivityStatus } = require('../controllers/activityController');
    const Activity = require('../models/Activity');

    const origFindById = Activity.findById;
    Activity.findById = () => ({
      populate: async () => ({
        _id: '650000000000000000000003',
        status: 'pending',
        userId: '650000000000000000000004',
        eventId: { createdBy: '650000000000000000000001' }
      })
    });

    // Test negative coins
    const reqNeg = {
      params: { id: '650000000000000000000003' },
      body: { status: 'approved', coinsAwarded: -5000 },
      user: { _id: '650000000000000000000001', role: 'admin' }
    };
    const resNeg = createMockRes();
    await updateActivityStatus(reqNeg, resNeg);
    assert.strictEqual(resNeg.statusCode, 400, 'Should reject negative coinsAwarded');
    assert(resNeg.data.message.includes('coinsAwarded must be an integer'));

    // Test huge coins (exploit attempt: 999999999)
    const reqHuge = {
      params: { id: '650000000000000000000003' },
      body: { status: 'approved', coinsAwarded: 999999999 },
      user: { _id: '650000000000000000000001', role: 'admin' }
    };
    const resHuge = createMockRes();
    await updateActivityStatus(reqHuge, resHuge);
    assert.strictEqual(resHuge.statusCode, 400, 'Should reject excessive coinsAwarded');
    console.log('   ✅ Attack blocked: Negative/excessive coin injections rejected with 400');

    Activity.findById = origFindById;
  }

  // Test 4: Negative coinCost in Shopkeeper Coupon Creation
  {
    console.log('4. Testing Negative coinCost exploit in Shop Coupon Creation...');
    const { createShopCoupon } = require('../controllers/shopkeeperController');
    const req = {
      body: {
        title: 'Exploit Coupon',
        description: 'Mints free coins',
        coinCost: -100
      },
      user: { _id: '650000000000000000000005', role: 'shopkeeper' }
    };
    const res = createMockRes();
    await createShopCoupon(req, res);
    assert.strictEqual(res.statusCode, 400, 'Should reject negative coinCost');
    console.log('   ✅ Attack blocked: Negative coin cost coupon creation rejected with 400');
  }

  // Test 5: Event Over-Capacity and Cancelled Status Join Prevention
  {
    console.log('5. Testing Event Over-Capacity and Cancelled Event Join...');
    const { joinEvent } = require('../controllers/eventController');
    const Event = require('../models/Event');
    const origFindById = Event.findById;

    // Full event
    Event.findById = async () => ({
      _id: '650000000000000000000006',
      status: 'upcoming',
      volunteersNeeded: 2,
      participants: ['650000000000000000000010', '650000000000000000000011']
    });

    const reqFull = {
      params: { id: '650000000000000000000006' },
      user: { _id: '650000000000000000000099' }
    };
    const resFull = createMockRes();
    await joinEvent(reqFull, resFull);
    assert.strictEqual(resFull.statusCode, 400, 'Should reject joining full event');
    assert(resFull.data.message.includes('capacity'));

    // Cancelled event
    Event.findById = async () => ({
      _id: '650000000000000000000007',
      status: 'cancelled',
      volunteersNeeded: 10,
      participants: []
    });
    const reqCancelled = {
      params: { id: '650000000000000000000007' },
      user: { _id: '650000000000000000000099' }
    };
    const resCancelled = createMockRes();
    await joinEvent(reqCancelled, resCancelled);
    assert.strictEqual(resCancelled.statusCode, 400, 'Should reject joining cancelled event');
    console.log('   ✅ Attack blocked: Joining full or cancelled events rejected with 400');

    Event.findById = origFindById;
  }

  // Test 6: Donation Confirmation Null NGO Crash & Duplication Guard
  {
    console.log('6. Testing Donation Confirmation Null NGO Crash & Duplication Guard...');
    const { handleDonationAction } = require('../controllers/donationController');
    const Donation = require('../models/Donation');
    const NGO = require('../models/NGO');

    const origDonationFindById = Donation.findById;
    const origNGOFindOne = NGO.findOne;

    // Non-NGO caller attempting to confirm
    Donation.findById = async () => ({
      _id: '650000000000000000000008',
      ngoId: '650000000000000000000020',
      status: 'proof_submitted'
    });
    NGO.findOne = async () => null; // Not an NGO

    const reqNonNGO = {
      params: { id: '650000000000000000000008', action: 'confirm' },
      user: { _id: '650000000000000000000099' }
    };
    const resNonNGO = createMockRes();
    await handleDonationAction(reqNonNGO, resNonNGO);
    assert.strictEqual(resNonNGO.statusCode, 403, 'Should return 403 Forbidden without crashing');

    // Already verified donation re-confirm attempt
    Donation.findById = async () => ({
      _id: '650000000000000000000008',
      ngoId: '650000000000000000000020',
      status: 'verified'
    });
    NGO.findOne = async () => ({ _id: '650000000000000000000020' });

    const reqDuplicate = {
      params: { id: '650000000000000000000008', action: 'confirm' },
      user: { _id: '650000000000000000000020' }
    };
    const resDuplicate = createMockRes();
    await handleDonationAction(reqDuplicate, resDuplicate);
    assert.strictEqual(resDuplicate.statusCode, 400, 'Should reject re-confirming already verified donation');
    console.log('   ✅ Attack blocked: Null NGO safely handled (403), re-confirmation blocked (400)');

    Donation.findById = origDonationFindById;
    NGO.findOne = origNGOFindOne;
  }

  // Test 7: Comment Payload Exhaustion Guard
  {
    console.log('7. Testing Comment / Post Payload Bounds...');
    const { commentOnPost } = require('../controllers/socialController');
    const reqHugeComment = {
      params: { postId: '650000000000000000000030' },
      body: { text: 'A'.repeat(50000) },
      user: { _id: '650000000000000000000099' }
    };
    const resHugeComment = createMockRes();
    await commentOnPost(reqHugeComment, resHugeComment);
    assert.strictEqual(resHugeComment.statusCode, 400, 'Should reject comments exceeding 1000 characters');
    console.log('   ✅ Attack blocked: Massive payload comment rejected with 400');
  }

  console.log('\n🎉 ALL 7 UNTRUSTED USER SECURITY CHECKS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('\n❌ Security test failed:', err);
  process.exit(1);
});
