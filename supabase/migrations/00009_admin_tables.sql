-- Migration: 00009_admin_tables
-- Description: Create admin/billing/feature-flag tables with RLS

-- =============================================================================
-- 1. audit_logs
-- =============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================================================
-- 2. plans
-- =============================================================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  credits_monthly INTEGER NOT NULL DEFAULT 0,
  storage_limit_mb INTEGER NOT NULL DEFAULT 0,
  max_documents INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 3. subscriptions
-- =============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  provider TEXT,
  provider_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- =============================================================================
-- 4. credit_accounts
-- =============================================================================
CREATE TABLE credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_accounts_user_id ON credit_accounts(user_id);

-- =============================================================================
-- 5. credit_transactions
-- =============================================================================
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES credit_accounts(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'purchase', 'usage', 'bonus', 'refund', 'admin_adj')),
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_transactions_account_id ON credit_transactions(account_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- =============================================================================
-- 6. coupons
-- =============================================================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_credits', 'plan_upgrade')),
  discount_value NUMERIC(10,2) NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupons_code ON coupons(code);

-- =============================================================================
-- 7. coupon_redemptions
-- =============================================================================
CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)
);

CREATE INDEX idx_coupon_redemptions_coupon_id ON coupon_redemptions(coupon_id);
CREATE INDEX idx_coupon_redemptions_user_id ON coupon_redemptions(user_id);

-- =============================================================================
-- 8. feature_flags
-- =============================================================================
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_roles TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feature_flags_key ON feature_flags(key);

-- =============================================================================
-- 9. system_settings
-- =============================================================================
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- RLS: Enable on all tables
-- =============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies: Admin full access
-- =============================================================================

-- Helper: check if user has admin or super_admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- audit_logs: admin only
CREATE POLICY "admin_read_audit_logs" ON audit_logs
  FOR SELECT USING (is_admin());
CREATE POLICY "admin_insert_audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (is_admin());

-- plans: admin write, all authenticated read active plans
CREATE POLICY "admin_all_plans" ON plans
  FOR ALL USING (is_admin());
CREATE POLICY "users_read_active_plans" ON plans
  FOR SELECT USING (is_active = true);

-- subscriptions: admin all, users read own
CREATE POLICY "admin_all_subscriptions" ON subscriptions
  FOR ALL USING (is_admin());
CREATE POLICY "users_read_own_subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- credit_accounts: admin all, users read own
CREATE POLICY "admin_all_credit_accounts" ON credit_accounts
  FOR ALL USING (is_admin());
CREATE POLICY "users_read_own_credit_account" ON credit_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- credit_transactions: admin all, users read own via account
CREATE POLICY "admin_all_credit_transactions" ON credit_transactions
  FOR ALL USING (is_admin());
CREATE POLICY "users_read_own_credit_transactions" ON credit_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM credit_accounts
      WHERE credit_accounts.id = credit_transactions.account_id
      AND credit_accounts.user_id = auth.uid()
    )
  );

-- coupons: admin only
CREATE POLICY "admin_all_coupons" ON coupons
  FOR ALL USING (is_admin());

-- coupon_redemptions: admin all, users read own
CREATE POLICY "admin_all_coupon_redemptions" ON coupon_redemptions
  FOR ALL USING (is_admin());
CREATE POLICY "users_read_own_coupon_redemptions" ON coupon_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- feature_flags: admin only
CREATE POLICY "admin_all_feature_flags" ON feature_flags
  FOR ALL USING (is_admin());

-- system_settings: admin only
CREATE POLICY "admin_all_system_settings" ON system_settings
  FOR ALL USING (is_admin());
