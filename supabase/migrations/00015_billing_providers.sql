-- Map external provider products onto our plans.
-- Nullable columns only: existing rows and existing queries keep working.
-- subscriptions.provider / provider_subscription_id already exist (00009).

ALTER TABLE plans ADD COLUMN IF NOT EXISTS lemonsqueezy_variant_id TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS apple_product_id TEXT;

-- One plan per external product, but many plans may have none yet.
CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_ls_variant
  ON plans(lemonsqueezy_variant_id) WHERE lemonsqueezy_variant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_apple_product
  ON plans(apple_product_id) WHERE apple_product_id IS NOT NULL;

-- Webhooks retry. Without this, a replayed event creates a duplicate row and
-- ProPlanGuard's .single() starts throwing for that user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_ref
  ON subscriptions(provider, provider_subscription_id)
  WHERE provider IS NOT NULL AND provider_subscription_id IS NOT NULL;
