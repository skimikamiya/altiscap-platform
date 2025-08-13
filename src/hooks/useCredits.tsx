import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les crédits de l'utilisateur depuis Supabase
  const loadCredits = useCallback(async () => {
    if (!user) {
      setCredits(0);
      setLoading(false);
      return;
    }

    try {
      // Utiliser la fonction RPC pour récupérer les crédits
      const { data, error } = await (supabase as any).rpc('get_user_credits', {
        user_id_param: user.id
      });

      if (error) {
        // Si l'utilisateur n'a pas encore de compte de crédits, en créer un
        if (error.code === 'PGRST116') {
          await initializeCredits();
        } else {
          throw error;
        }
      } else if (data && data.length > 0) {
        setCredits(data[0].credits);
      } else {
        await initializeCredits();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des crédits';
      setError(errorMessage);
      console.error('Erreur lors du chargement des crédits:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initialiser les crédits pour un nouvel utilisateur
  const initializeCredits = async () => {
    if (!user) return;

    try {
      // Utiliser la fonction RPC pour créer un compte de crédits
      const { data, error } = await (supabase as any).rpc('create_user_credits', {
        user_id_param: user.id,
        initial_credits: 50
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setCredits(data[0].credits);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'initialisation des crédits';
      setError(errorMessage);
      console.error('Erreur lors de l\'initialisation des crédits:', err);
    }
  };

  // Consommer des crédits
  const consumeCredits = async (amount: number, reason?: string) => {
    if (!user || credits < amount) {
      throw new Error('Crédits insuffisants');
    }

    try {
      // Utiliser la fonction RPC pour consommer les crédits
      const { data, error } = await (supabase as any).rpc('consume_user_credits', {
        user_id_param: user.id,
        credits_to_consume: amount,
        reason: reason || 'Consommation de crédits'
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setCredits(data[0].credits);
        return true;
      }
      return false;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la consommation des crédits';
      setError(errorMessage);
      console.error('Erreur lors de la consommation des crédits:', err);
      return false;
    }
  };

  // Ajouter des crédits (pour les achats)
  const addCredits = async (amount: number, reason?: string) => {
    if (!user) return false;

    try {
      // Utiliser la fonction RPC pour ajouter des crédits
      const { data, error } = await (supabase as any).rpc('add_user_credits', {
        user_id_param: user.id,
        credits_to_add: amount,
        reason: reason || 'Ajout de crédits'
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setCredits(data[0].credits);
        return true;
      }
      return false;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout des crédits';
      setError(errorMessage);
      console.error('Erreur lors de l\'ajout des crédits:', err);
      return false;
    }
  };

  // Vérifier si l'utilisateur a suffisamment de crédits
  const hasEnoughCredits = (required: number) => {
    return credits >= required;
  };

  // Obtenir le solde des crédits
  const getCreditBalance = async () => {
    if (!user) return 0;

    try {
      const { data, error } = await (supabase as any).rpc('get_user_credit_balance', {
        user_id_param: user.id
      });

      if (error) throw error;
      return data || 0;
    } catch (err) {
      console.error('Erreur lors de la récupération du solde:', err);
      return credits; // Retourner la valeur locale en cas d'erreur
    }
  };

  // Obtenir l'historique des transactions
  const getTransactionHistory = async (limit: number = 50) => {
    if (!user) return [];

    try {
      const { data, error } = await (supabase as any).rpc('get_user_transactions', {
        user_id_param: user.id,
        limit_count: limit
      });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err);
      return [];
    }
  };

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  return {
    credits,
    loading,
    error,
    consumeCredits,
    addCredits,
    hasEnoughCredits,
    refreshCredits: loadCredits,
    getCreditBalance,
    getTransactionHistory,
  };
};
