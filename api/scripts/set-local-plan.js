/**
 * Grants a plan locally, without Stripe.
 *
 *   node api/scripts/set-local-plan.js you@example.com enterprise
 *   node api/scripts/set-local-plan.js you@example.com free
 *
 * Why this exists: every limit in the product reads the Subscription row, not
 * the User row — so there is nothing on a user to flip. Testing Pro or
 * Enterprise behaviour otherwise means completing a real Stripe checkout, which
 * is a lot of ceremony to see whether a counter says 3 instead of 1.
 *
 * DEVELOPMENT ONLY. It writes a subscription with a fake customerId and no
 * Stripe subscriptionId, which means:
 *   - "Cancel subscription" and the billing portal will fail on this row,
 *     because there is nothing real behind it.
 *   - A genuine Stripe webhook for this user would overwrite it, which is
 *     correct — Stripe is the source of truth in production.
 * It refuses to run against NODE_ENV=production for that reason.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });

const mongoose = require('mongoose');

const PLANS = {
  free: { planId: 'free', planName: 'Free' },
  pro: { planId: 'pro', planName: 'Pro' },
  enterprise: { planId: 'enterprise', planName: 'Enterprise' },
};

(async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to run in production. Stripe owns subscriptions there.');
    process.exit(1);
  }

  const [email, planKey = 'pro'] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: node api/scripts/set-local-plan.js <email> [free|pro|enterprise]');
    process.exit(1);
  }

  const plan = PLANS[planKey];
  if (!plan) {
    console.error(`Unknown plan "${planKey}". Use one of: ${Object.keys(PLANS).join(', ')}`);
    process.exit(1);
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGO_URI / MONGODB_URI found in api/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection;

  const user = await db.collection('users').findOne({ email });
  if (!user) {
    console.error(`No user with email ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  // A year out, so `computeIsActive` sees an unexpired period.
  const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  await db.collection('subscriptions').updateOne(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        // Marked so nobody mistakes this for a real Stripe customer later.
        customerId: `cus_local_${String(user._id).slice(-8)}`,
        subscriptionId: null,
        status: 'active',
        planId: plan.planId,
        planName: plan.planName,
        priceId: null,
        billingInterval: 'month',
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        latestInvoiceStatus: 'paid',
        latestPaymentAt: new Date(),
        metadata: { grantedLocally: true, grantedAt: new Date() },
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  /*
    Campaign allowances are counted, not just capped.

    Free is a LIFETIME limit of one campaign, tracked on the user as
    lifetimeCampaignsCreated — so an account that already used its free campaign
    stays blocked after an upgrade unless that counter is cleared too. Pro and
    Enterprise count per billing cycle instead, which is why this is safe to
    reset here.
  */
  if (plan.planId !== 'free') {
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lifetimeCampaignsCreated: 0 } }
    );
  }

  console.log(`${email} -> ${plan.planName}`);
  console.log(`  active until ${periodEnd.toDateString()}`);
  console.log('  sign out and back in, or hard-refresh, to pick it up.');

  await mongoose.disconnect();
})().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
