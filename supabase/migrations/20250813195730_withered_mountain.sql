/*
# Système complet ALTISCAP - Authentification et Crédits

1. Tables principales
   - `user_credits` - Gestion des crédits utilisateur
   - `credit_transactions` - Historique des transactions
   - `credit_purchases` - Achats de crédits
   - `credit_packs` - Packs de crédits disponibles
   - `global_settings` - Paramètres globaux

2. Sécurité
   - RLS activé sur toutes les tables
   - Politiques pour utilisateurs et admins
   - Triggers automatiques

3. Fonctions RPC
   - Gestion complète des crédits
   - Administration
   - Transactions sécurisées
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des crédits utilisateur
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    credits INTEGER NOT NULL DEFAULT 50 CHECK (credits >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des transactions de crédits
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'consumption', 'bonus', 'refund', 'admin_adjustment')),
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des achats de crédits
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    pack_id TEXT NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    amount_euros DECIMAL(10,2) NOT NULL CHECK (amount_euros > 0),
    stripe_payment_intent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 4. Table des packs de crédits
CREATE TABLE IF NOT EXISTS credit_packs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    price_euros DECIMAL(10,2) NOT NULL CHECK (price_euros > 0),
    popular BOOLEAN DEFAULT FALSE,
    features JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des paramètres globaux
CREATE TABLE IF NOT EXISTS global_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion des paramètres globaux par défaut
INSERT INTO global_settings (key, value, description) VALUES
('free_credits', '50', 'Nombre de crédits gratuits pour les nouveaux utilisateurs'),
('analysis_cost', '5', 'Coût en crédits pour une analyse de due diligence'),
('min_credits_purchase', '100', 'Nombre minimum de crédits pour un achat'),
('max_credits_purchase', '10000', 'Nombre maximum de crédits pour un achat')
ON CONFLICT (key) DO NOTHING;

-- Insertion des packs de crédits par défaut
INSERT INTO credit_packs (id, name, credits, price_euros, popular, features) VALUES
('starter', 'Pack Découverte', 100, 10.00, FALSE, '["100 crédits", "Support email"]'),
('professional', 'Pack Professionnel', 500, 45.00, TRUE, '["500 crédits", "Support prioritaire", "Rapports détaillés"]'),
('enterprise', 'Pack Entreprise', 2000, 150.00, FALSE, '["2000 crédits", "Support dédié", "API access", "Rapports personnalisés"]')
ON CONFLICT (id) DO NOTHING;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at 
    BEFORE UPDATE ON user_credits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_global_settings_updated_at ON global_settings;
CREATE TRIGGER update_global_settings_updated_at 
    BEFORE UPDATE ON global_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_packs_updated_at ON credit_packs;
CREATE TRIGGER update_credit_packs_updated_at 
    BEFORE UPDATE ON credit_packs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour gérer les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    free_credits_amount INTEGER;
BEGIN
    -- Récupérer le nombre de crédits gratuits
    SELECT value::integer INTO free_credits_amount
    FROM global_settings
    WHERE key = 'free_credits';
    
    -- Valeur par défaut si pas trouvée
    IF free_credits_amount IS NULL THEN
        free_credits_amount := 50;
    END IF;
    
    -- Créer le compte de crédits
    INSERT INTO user_credits (user_id, credits)
    VALUES (NEW.id, free_credits_amount);
    
    -- Enregistrer la transaction
    INSERT INTO credit_transactions (user_id, type, amount, balance_before, balance_after, description)
    VALUES (
        NEW.id,
        'bonus',
        free_credits_amount,
        0,
        free_credits_amount,
        'Crédits gratuits de bienvenue'
    );
    
    RETURN NEW;
END;
$$;

-- Trigger pour automatiquement créer un compte de crédits pour les nouveaux utilisateurs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Activation de Row Level Security (RLS)
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;
DROP POLICY IF EXISTS "Admins can view all credits" ON user_credits;
DROP POLICY IF EXISTS "Users can view their own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can view their own purchases" ON credit_purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON credit_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON credit_purchases;
DROP POLICY IF EXISTS "Everyone can view global settings" ON global_settings;
DROP POLICY IF EXISTS "Only admins can modify global settings" ON global_settings;
DROP POLICY IF EXISTS "Everyone can view credit packs" ON credit_packs;
DROP POLICY IF EXISTS "Only admins can modify credit packs" ON credit_packs;

-- Politiques RLS pour user_credits
CREATE POLICY "Users can view their own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage credits" ON user_credits
    FOR ALL USING (true);

-- Politiques RLS pour credit_transactions
CREATE POLICY "Users can view their own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage transactions" ON credit_transactions
    FOR ALL USING (true);

-- Politiques RLS pour credit_purchases
CREATE POLICY "Users can view their own purchases" ON credit_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON credit_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage purchases" ON credit_purchases
    FOR ALL USING (true);

-- Politiques RLS pour global_settings
CREATE POLICY "Everyone can view global settings" ON global_settings
    FOR SELECT USING (true);

CREATE POLICY "System can manage global settings" ON global_settings
    FOR ALL USING (true);

-- Politiques RLS pour credit_packs
CREATE POLICY "Everyone can view credit packs" ON credit_packs
    FOR SELECT USING (true);

CREATE POLICY "System can manage credit packs" ON credit_packs
    FOR ALL USING (true);

-- Fonctions RPC pour la gestion des crédits

-- 1. Fonction pour récupérer les crédits d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_credits(user_id_param UUID)
RETURNS TABLE(id UUID, user_id UUID, credits INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT uc.id, uc.user_id, uc.credits, uc.created_at, uc.updated_at
  FROM user_credits uc
  WHERE uc.user_id = user_id_param;
END;
$$;

-- 2. Fonction pour créer un compte de crédits
CREATE OR REPLACE FUNCTION create_user_credits(user_id_param UUID, initial_credits INTEGER DEFAULT 50)
RETURNS TABLE(id UUID, user_id UUID, credits INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_record user_credits%ROWTYPE;
BEGIN
  INSERT INTO user_credits (user_id, credits)
  VALUES (user_id_param, initial_credits)
  ON CONFLICT (user_id) DO UPDATE SET credits = EXCLUDED.credits
  RETURNING * INTO new_record;
  
  RETURN QUERY
  SELECT new_record.id, new_record.user_id, new_record.credits, 
         new_record.created_at, new_record.updated_at;
END;
$$;

-- 3. Fonction pour mettre à jour les crédits d'un utilisateur
CREATE OR REPLACE FUNCTION update_user_credits(user_id_param UUID, new_credits INTEGER)
RETURNS TABLE(id UUID, user_id UUID, credits INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_record user_credits%ROWTYPE;
  old_credits INTEGER;
BEGIN
  -- Récupérer l'ancien solde
  SELECT credits INTO old_credits FROM user_credits WHERE user_id = user_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', user_id_param;
  END IF;
  
  -- Mettre à jour les crédits
  UPDATE user_credits 
  SET credits = new_credits, updated_at = NOW()
  WHERE user_id = user_id_param
  RETURNING * INTO updated_record;
  
  -- Enregistrer la transaction
  INSERT INTO credit_transactions (user_id, type, amount, balance_before, balance_after, description)
  VALUES (
    user_id_param, 
    'admin_adjustment', 
    new_credits - old_credits, 
    old_credits, 
    new_credits, 
    'Ajustement administrateur'
  );
  
  RETURN QUERY
  SELECT updated_record.id, updated_record.user_id, updated_record.credits, 
         updated_record.created_at, updated_record.updated_at;
END;
$$;

-- 4. Fonction pour ajouter des crédits
CREATE OR REPLACE FUNCTION add_user_credits(user_id_param UUID, credits_to_add INTEGER, reason TEXT DEFAULT 'Ajout de crédits')
RETURNS TABLE(id UUID, user_id UUID, credits INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_record user_credits%ROWTYPE;
  current_credits INTEGER;
BEGIN
  -- Récupérer les crédits actuels
  SELECT credits INTO current_credits FROM user_credits WHERE user_id = user_id_param;
  
  IF NOT FOUND THEN
    -- Créer le compte s'il n'existe pas
    INSERT INTO user_credits (user_id, credits) VALUES (user_id_param, credits_to_add)
    RETURNING * INTO updated_record;
    current_credits := 0;
  ELSE
    -- Mettre à jour les crédits
    UPDATE user_credits 
    SET credits = credits + credits_to_add, updated_at = NOW()
    WHERE user_id = user_id_param
    RETURNING * INTO updated_record;
  END IF;
  
  -- Enregistrer la transaction
  INSERT INTO credit_transactions (user_id, type, amount, balance_before, balance_after, description)
  VALUES (user_id_param, 'bonus', credits_to_add, current_credits, current_credits + credits_to_add, reason);
  
  RETURN QUERY
  SELECT updated_record.id, updated_record.user_id, updated_record.credits, 
         updated_record.created_at, updated_record.updated_at;
END;
$$;

-- 5. Fonction pour consommer des crédits
CREATE OR REPLACE FUNCTION consume_user_credits(user_id_param UUID, credits_to_consume INTEGER, reason TEXT DEFAULT 'Consommation de crédits')
RETURNS TABLE(id UUID, user_id UUID, credits INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_record user_credits%ROWTYPE;
  current_credits INTEGER;
BEGIN
  -- Vérifier les crédits disponibles
  SELECT credits INTO current_credits FROM user_credits WHERE user_id = user_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', user_id_param;
  END IF;
  
  IF current_credits < credits_to_consume THEN
    RAISE EXCEPTION 'Crédits insuffisants. Disponible: %, Requis: %', current_credits, credits_to_consume;
  END IF;
  
  -- Consommer les crédits
  UPDATE user_credits 
  SET credits = credits - credits_to_consume, updated_at = NOW()
  WHERE user_id = user_id_param
  RETURNING * INTO updated_record;
  
  -- Enregistrer la transaction
  INSERT INTO credit_transactions (user_id, type, amount, balance_before, balance_after, description)
  VALUES (user_id_param, 'consumption', credits_to_consume, current_credits, current_credits - credits_to_consume, reason);
  
  RETURN QUERY
  SELECT updated_record.id, updated_record.user_id, updated_record.credits, 
         updated_record.created_at, updated_record.updated_at;
END;
$$;

-- 6. Fonction pour obtenir le solde des crédits
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credit_balance INTEGER;
BEGIN
  SELECT COALESCE(credits, 0) INTO credit_balance
  FROM user_credits
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(credit_balance, 0);
END;
$$;

-- 7. Fonction pour l'historique des transactions
CREATE OR REPLACE FUNCTION get_user_transactions(user_id_param UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
  id UUID, 
  type TEXT, 
  amount INTEGER, 
  balance_before INTEGER, 
  balance_after INTEGER, 
  description TEXT, 
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ct.id, ct.type, ct.amount, ct.balance_before, ct.balance_after, ct.description, ct.created_at
  FROM credit_transactions ct
  WHERE ct.user_id = user_id_param
  ORDER BY ct.created_at DESC
  LIMIT limit_count;
END;
$$;

-- 8. Fonction pour obtenir les paramètres globaux
CREATE OR REPLACE FUNCTION get_global_settings()
RETURNS TABLE(key TEXT, value TEXT, description TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT gs.key, gs.value, gs.description
  FROM global_settings gs
  ORDER BY gs.key;
END;
$$;

-- 9. Fonction pour obtenir les packs de crédits
CREATE OR REPLACE FUNCTION get_credit_packs()
RETURNS TABLE(
  id TEXT, 
  name TEXT, 
  credits INTEGER, 
  price_euros DECIMAL, 
  popular BOOLEAN, 
  features JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT cp.id, cp.name, cp.credits, cp.price_euros, cp.popular, cp.features
  FROM credit_packs cp
  WHERE cp.active = true
  ORDER BY cp.credits ASC;
END;
$$;

-- 10. Fonction pour obtenir tous les utilisateurs (admin)
CREATE OR REPLACE FUNCTION get_all_users_with_credits()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  credits INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    COALESCE(uc.credits, 0) as credits,
    u.created_at
  FROM auth.users u
  LEFT JOIN user_credits uc ON u.id = uc.user_id
  ORDER BY u.created_at DESC;
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_user_credits(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_user_credits(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_user_credits(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_user_credits(UUID, INTEGER, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION consume_user_credits(UUID, INTEGER, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_credit_balance(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_transactions(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_global_settings() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_credit_packs() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_all_users_with_credits() TO authenticated, anon;

-- Accorder les permissions sur les tables
GRANT ALL ON user_credits TO authenticated, anon;
GRANT ALL ON credit_transactions TO authenticated, anon;
GRANT ALL ON credit_purchases TO authenticated, anon;
GRANT SELECT ON global_settings TO authenticated, anon;
GRANT SELECT ON credit_packs TO authenticated, anon;