import { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import express from 'express';
import * as stripeService from '../services/stripe.service';

const router = Router();

const log = (msg: string, meta?: unknown) =>
  console.log(`[stripe-webhook] ${msg}`, meta ?? '');

/**
 * Stripe webhook.
 *
 * IMPORTANT for reliability:
 * - This router is mounted at `/api/billing/webhook` in server.ts BEFORE
 *   `express.json()`, and BEFORE the authenticated `/api/billing` routes, so it
 *   never passes through auth middleware (no 401) and always matches (no 404).
 * - `express.raw` keeps the body as a Buffer so the Stripe signature can be
 *   verified. Any JSON parsing here would break verification.
 * - A handler that throws returns 500 so Stripe RETRIES. This used to log the
 *   error and acknowledge anyway, which meant a five-second database blip
 *   during checkout.session.completed left a paying customer recorded as
 *   unsubscribed forever: Stripe never sent the event again and nothing else
 *   reconciled. Every handler below is idempotent — the syncs are upserts keyed
 *   on the Stripe id — so replaying an event is always safe.
 */

// Lightweight health check to confirm the route is reachable (no auth).
router.get('/', (_req: Request, res: Response): void => {
  res.json({ ok: true, endpoint: 'stripe-webhook' });
});

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['stripe-signature'] as string | undefined;

    if (!signature) {
      log('Missing stripe-signature header');
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripeService.constructWebhookEvent(req.body as Buffer, signature);
    } catch (err: any) {
      log('Signature verification failed', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    log(`Received event ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.subscription) {
            const sub = await stripeService
              .getStripe()
              .subscriptions.retrieve(session.subscription as string);
            await stripeService.syncSubscriptionFromStripe(sub);
          }
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          await stripeService.syncSubscriptionFromStripe(
            event.data.object as Stripe.Subscription
          );
          break;
        }
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId =
            typeof invoice.customer === 'string'
              ? invoice.customer
              : invoice.customer?.id;
          const succeeded = event.type === 'invoice.payment_succeeded';

          if (customerId) {
            await stripeService.recordInvoiceStatus(
              customerId,
              succeeded ? 'paid' : 'failed',
              succeeded ? (invoice.status_transitions?.paid_at ?? null) : null
            );
          }

          const subId = (invoice as any).subscription;
          if (subId) {
            const sub = await stripeService.getStripe().subscriptions.retrieve(subId as string);
            await stripeService.syncSubscriptionFromStripe(sub);
          }
          break;
        }
        default:
          log(`Unhandled event type ${event.type}`);
          break;
      }
    } catch (err: any) {
      /*
        500 so Stripe retries with backoff. It gives up after about three days,
        which is a far better failure mode than a customer who has paid being
        shown as unsubscribed with nothing to correct it.

        Note this is only reached for genuine faults. An event about a customer
        we do not recognise is not an error — recordInvoiceStatus and the sync
        helpers return quietly in that case, so those still acknowledge.
      */
      log(`Handler error for ${event.type} — asking Stripe to retry`, err.message);
      res.status(500).json({ received: false, error: 'Handler failed, please retry' });
      return;
    }

    res.json({ received: true });
  }
);

export default router;
