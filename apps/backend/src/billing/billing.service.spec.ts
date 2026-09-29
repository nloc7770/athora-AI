import { createHmac } from 'node:crypto';
import { BillingService } from './billing.service';

const SECRET = 'whsec_test_secret';
const sign = (body: Buffer, secret = SECRET) =>
  createHmac('sha256', secret).update(body).digest('hex');

// null (not undefined) means "not configured" — passing undefined to a
// defaulted param would silently fall back to SECRET and void the test.
function makeService(secret: string | null = SECRET) {
  const config = {
    get: (key: string) =>
      key === 'LEMONSQUEEZY_WEBHOOK_SECRET' ? (secret ?? undefined) : undefined,
  };
  return new BillingService({} as any, config as any);
}

describe('BillingService.verifyLemonSqueezySignature', () => {
  const body = Buffer.from(JSON.stringify({ meta: { event_name: 'subscription_created' } }));

  it('accepts a signature produced with the configured secret', () => {
    expect(makeService().verifyLemonSqueezySignature(body, sign(body))).toBe(true);
  });

  it('rejects a body tampered with after signing', () => {
    const sig = sign(body);
    const tampered = Buffer.from(JSON.stringify({ meta: { event_name: 'subscription_expired' } }));
    expect(makeService().verifyLemonSqueezySignature(tampered, sig)).toBe(false);
  });

  it('rejects a signature made with a different secret', () => {
    expect(makeService().verifyLemonSqueezySignature(body, sign(body, 'wrong'))).toBe(false);
  });

  // timingSafeEqual throws on length mismatch — must be gated, not crash into a 500.
  it('rejects a short or non-hex signature without throwing', () => {
    const svc = makeService();
    expect(svc.verifyLemonSqueezySignature(body, 'abcd')).toBe(false);
    expect(svc.verifyLemonSqueezySignature(body, 'zzzz')).toBe(false);
    expect(svc.verifyLemonSqueezySignature(body, '')).toBe(false);
  });

  it('fails closed when the header or raw body is missing', () => {
    const svc = makeService();
    expect(svc.verifyLemonSqueezySignature(body, undefined)).toBe(false);
    expect(svc.verifyLemonSqueezySignature(undefined, sign(body))).toBe(false);
  });

  // An unset secret must not mean "everything is valid".
  it('fails closed when the secret is not configured', () => {
    expect(makeService(null).verifyLemonSqueezySignature(body, sign(body))).toBe(false);
  });
});
