-- Migration complète pour le système de crédits ALTISCAP
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Table des crédits utilisateur
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    credits INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des paramètres globaux
CREATE TABLE IF NOT EXISTS global_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des transactions de crédits
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'consumption', 'bonus', 'refund', 'admin_adjustment')),
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des achats de crédits
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pack_id TEXT NOT NULL,
    credits INTEGER NOT NULL,
    amount_euros DECIMAL(10,2) NOT NULL,
    stripe_payment_intent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 5. Table des packs de crédits
CREATE TABLE IF NOT EXISTS credit_packs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    price_euros DECIMAL(10,2) NOT NULL,
    popular BOOLEAN DEFAULT FALSE,
    features JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion des paramètres globaux par défaut
INSERT INTO global_settings (key, value, description) VALUES
('free_credits', '50', 'Nombre de crédits gratuits pour les nouveaux utilisateurs'),
('credit_price', '0.10', 'Prix par crédit en euros'),
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
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_settings_updated_at BEFORE UPDATE ON global_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_packs_updated_at BEFORE UPDATE ON credit_packs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour gérer les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Récupérer le nombre de crédits gratuits depuis les paramètres globaux
    INSERT INTO user_credits (user_id, credits)
    SELECT NEW.id, (value::text)::integer
    FROM global_settings
    WHERE key = 'free_credits';
    
    -- Enregistrer la transaction
    INSERT INTO credit_transactions (user_id, type, amount, balance_before, balance_after, description)
    SELECT 
        NEW.id,
        'bonus',
        (value::text)::integer,
        0,
        (value::text)::integer,
        'Crédits gratuits de bienvenue'
    FROM global_settings
    WHERE key = 'free_credits';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour automatiquement créer un compte de crédits pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Activation de Row Level Security (RLS)
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_credits
CREATE POLICY "Users can view their own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON user_credits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credits" ON user_credits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour credit_transactions
CREATE POLICY "Users can view their own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON credit_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour credit_purchases
CREATE POLICY "Users can view their own purchases" ON credit_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON credit_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" ON credit_purchases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour global_settings (lecture seule pour tous, modification admin seulement)
CREATE POLICY "Everyone can view global settings" ON global_settings
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify global settings" ON global_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Politiques RLS pour credit_packs (lecture seule pour tous, modification admin seulement)
CREATE POLICY "Everyone can view credit packs" ON credit_packs
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify credit packs" ON credit_packs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Accorder les permissions nécessaires
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_credits TO authenticated;
GRANT ALL ON credit_transactions TO authenticated;
GRANT ALL ON credit_purchases TO authenticated;
GRANT SELECT ON global_settings TO authenticated;
GRANT SELECT ON credit_packs TO authenticated;
