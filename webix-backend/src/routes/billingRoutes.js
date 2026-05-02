const express = require('express');
const Stripe = require('stripe');
const { supabase } = require('../lib/supabase');
const authenticate = require('../middleware/auth');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Map plans and add-ons to pricing (in cents)
const PRODUCT_PRICES = {
  // Plans
  hobbyist: 500,   // $5.00
  developer: 1500, // $15.00
  promax: 3500,    // $35.00
  // Add-ons
  theme_addon: 300,       // $3.00
  ram_boost_2gb: 500,     // $5.00
  storage_boost_50gb: 500 // $5.00
};

// POST /api/billing/create-checkout-session
router.post('/create-checkout-session', authenticate, async (req, res) => {
  const body = req.body || {};
  const rawProduct = (body.plan || body.product || "").toString().trim();
  
  // Find case-insensitive match
  const product = Object.keys(PRODUCT_PRICES).find(
    k => k.toLowerCase() === rawProduct.toLowerCase()
  );

  const userId = req.user.id;
  const email = req.user.email;

  console.log(`[Stripe] Checkout request. User: ${userId}, Raw: "${rawProduct}", Matched: "${product}"`);

  if (!product || !PRODUCT_PRICES[product]) {
    console.error(`[Stripe] 400 Bad Request. Received Body:`, body);
    return res.status(400).json({ 
      error: 'Invalid plan selected',
      received: rawProduct,
      available: Object.keys(PRODUCT_PRICES),
      debug_body: body
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: product.includes('addon') || product.includes('boost') ? 'payment' : 'subscription',
      customer_email: email,
      client_reference_id: userId,
      metadata: { userId, product },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Webix ${product.replace(/_/g, ' ').toUpperCase()}`,
              description: `Purchase for Webix ${product.replace(/_/g, ' ')}.`
            },
            unit_amount: PRODUCT_PRICES[product],
            recurring: product.includes('addon') || product.includes('boost') ? undefined : { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?status=success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?status=cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe] Checkout Error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/billing/webhook
// This needs to use the raw body, so we'll configure it in index.js to bypass express.json()
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id || session.metadata.userId;
    const product = session.metadata.product;

    if (userId && product) {
      console.log(`[Stripe Webhook] Processing ${product} for user ${userId}`);
      
      let updateData = {};
      
      if (['hobbyist', 'developer', 'promax'].includes(product)) {
        updateData.subscription_tier = product;
      } else if (product === 'theme_addon') {
        updateData.has_theme_addon = true;
      } else if (product === 'ram_boost_2gb') {
        // We use SQL fragment to increment
        const { error } = await supabase.rpc('increment_ram', { user_id: userId, amount: 2048 });
        if (error) console.error('[Stripe Webhook] RAM Increment failed:', error);
        return res.send();
      } else if (product === 'storage_boost_50gb') {
        const { error } = await supabase.rpc('increment_storage', { user_id: userId, amount: 50 });
        if (error) console.error('[Stripe Webhook] Storage Increment failed:', error);
        return res.send();
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (error) console.error('[Stripe Webhook] DB Update failed:', error);
      }
    }
  }

  // Return a 200 res to acknowledge receipt of the event
  res.send();
});

module.exports = router;
