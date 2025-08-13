-- Fonctions RPC pour la gestion des crédits utilisateur ALTISCAP
-- À exécuter dans l'éditeur SQL de Supabase APRÈS avoir créé les tables

-- 1. Fonction pour récupérer les crédits d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_credits(user_id_param UUID)
RETURNS TABLE(id UUID, user_id UUID, credits INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT uc.id, uc.user_id, uc.credits, uc.created_at, uc.updated_at
  FROM user_credits uc
  WHERE uc.user_id = user_id_param;
END;
$$;

-- 2. Fonction pour créer un compte de crédits pour un nouvel utilisateur
CREATE OR REPLACE FUNCTION create_user_credits(user_id_param UUID, initial_credits INTEGER DEFAULT 50)
RETURNS TABLE(id UUID, user_id UUID, credits INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_record user_credits%ROWTYPE;
BEGIN
  INSERT INTO user_credits (user_id, credits)
  VALUES (user_id_param, initial_credits)
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
AS $$
DECLARE
  updated_record user_credits%ROWTYPE;
BEGIN
  UPDATE user_credits 
  SET credits = new_credits, updated_at = NOW()
  WHERE user_id = user_id_param
  RETURNING * INTO updated_record;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', user_id_param;
  END IF;
  
  RETURN QUERY
  SELECT updated_record.id, updated_record.user_id, updated_record.credits, 
         updated_record.created_at, updated_record.updated_at;
END;
$$;

-- 4. Fonction pour ajouter des crédits à un utilisateur
CREATE OR REPLACE FUNCTION add_user_credits(user_id_param UUID, credits_to_add INTEGER, reason TEXT DEFAULT 'Ajout de crédits')
RETURNS TABLE(id UUID, user_id UUID, credits INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_record user_credits%ROWTYPE;
  current_credits INTEGER;
BEGIN
  -- Récupérer les crédits actuels
  SELECT credits INTO current_credits
  FROM user_credits
  WHERE user_id = user_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', user_id_param;
  END IF;
  
  -- Mettre à jour les crédits
  UPDATE user_credits 
  SET credits = credits + credits_to_add, updated_at = NOW()
  WHERE user_id = user_id_param
  RETURNING * INTO updated_record;
  
  -- Enregistrer la transaction
  INSERT INTO credit_transactions (user_id, type, amount, balance_before, balance_after, description)
  VALUES (user_id_param, 'bonus', credits_to_add, current_credits, current_credits + credits_to_add, reason);
  
  RETURN QUERY
  SELECT updated_record.id, updated_record.user_id, updated_record.credits, 
         updated_record.created_at, updated_record.updated_at;
END;
$$;

-- 5. Fonction pour consommer des crédits d'un utilisateur
CREATE OR REPLACE FUNCTION consume_user_credits(user_id_param UUID, credits_to_consume INTEGER, reason TEXT DEFAULT 'Consommation de crédits')
RETURNS TABLE(id UUID, user_id UUID, credits INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_record user_credits%ROWTYPE;
  current_credits INTEGER;
BEGIN
  -- Vérifier les crédits disponibles
  SELECT credits INTO current_credits
  FROM user_credits
  WHERE user_id = user_id_param;
  
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

-- 6. Fonction pour obtenir le solde des crédits d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 7. Fonction pour vérifier si un utilisateur a suffisamment de crédits
CREATE OR REPLACE FUNCTION has_enough_credits(user_id_param UUID, required_credits INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT COALESCE(credits, 0) INTO current_credits
  FROM user_credits
  WHERE user_id = user_id_param;
  
  RETURN COALESCE(current_credits, 0) >= required_credits;
END;
$$;

-- 8. Fonction pour obtenir l'historique des transactions d'un utilisateur
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

-- 9. Fonction pour obtenir les paramètres globaux
CREATE OR REPLACE FUNCTION get_global_settings()
RETURNS TABLE(key TEXT, value JSONB, description TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT gs.key, gs.value, gs.description
  FROM global_settings gs
  ORDER BY gs.key;
END;
$$;

-- 10. Fonction pour obtenir les packs de crédits disponibles
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
AS $$
BEGIN
  RETURN QUERY
  SELECT cp.id, cp.name, cp.credits, cp.price_euros, cp.popular, cp.features
  FROM credit_packs cp
  WHERE cp.active = true
  ORDER BY cp.credits ASC;
END;
$$;

-- Accorder les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION get_user_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_credits(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_user_credits(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_credit_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_enough_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_transactions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_global_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION get_credit_packs() TO authenticated;
