import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Users, CreditCard, Settings, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import AltiscapLogo from '@/components/AltiscapLogo';

interface User {
  id: string;
  email: string;
  credits: number;
  created_at: string;
}

const Admin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingCredits, setUpdatingCredits] = useState<string | null>(null);
  const [newCredits, setNewCredits] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'administration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Utiliser la fonction RPC pour récupérer tous les utilisateurs avec leurs crédits
      const { data: usersData, error: usersError } = await supabase.rpc('get_all_users_with_credits');
      
      if (usersError) throw usersError;

      if (usersData) {
        const formattedUsers = usersData.map((user: any) => ({
          id: user.user_id,
          email: user.email || 'Email non disponible',
          credits: user.credits || 0,
          created_at: user.created_at
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const updateUserCredits = async (userId: string, newCredits: number) => {
    try {
      setUpdatingCredits(userId);
      
      const { error } = await supabase.rpc('update_user_credits', {
        user_id_param: userId,
        new_credits: newCredits
      });
      
      if (error) throw error;
      
      // Mettre à jour la liste locale
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, credits: newCredits } : user
        )
      );
      
      toast({
        title: "Succès",
        description: `Crédits mis à jour pour ${users.find(u => u.id === userId)?.email}`,
      });
      
      setNewCredits(prev => ({ ...prev, [userId]: '' }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour des crédits:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les crédits",
        variant: "destructive",
      });
    } finally {
      setUpdatingCredits(null);
    }
  };

  const addFreeCredits = async (userId: string, amount: number) => {
    try {
      setUpdatingCredits(userId);
      
      const { error } = await supabase.rpc('add_user_credits', {
        user_id_param: userId,
        credits_to_add: amount,
        reason: 'Crédits gratuits administrateur'
      });
      
      if (error) throw error;
      
      // Mettre à jour la liste locale
      const user = users.find(u => u.id === userId);
      if (user) {
        const newCredits = user.credits + amount;
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === userId ? { ...u, credits: newCredits } : u
          )
        );
      }
      
      toast({
        title: "Succès",
        description: `${amount} crédits gratuits ajoutés à ${user?.email}`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout des crédits gratuits:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les crédits gratuits",
        variant: "destructive",
      });
    } finally {
      setUpdatingCredits(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute adminOnly>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement de l'interface d'administration...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <AltiscapLogo size="lg" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Administration ALTISCAP</h1>
                  <p className="text-sm text-gray-600">Gestion des utilisateurs et paramètres</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          {/* Gestion des utilisateurs */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Gestion des utilisateurs ({users.length})</span>
              </CardTitle>
              <CardDescription>
                Gérez les crédits des utilisateurs et attribuez des crédits gratuits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.email}</p>
                      <p className="text-sm text-gray-600">
                        Crédits actuels : <span className="font-semibold">{user.credits}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Inscrit le : {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="Nouveaux crédits"
                          value={newCredits[user.id] || ''}
                          onChange={(e) => setNewCredits(prev => ({ ...prev, [user.id]: e.target.value }))}
                          className="w-24"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const credits = parseInt(newCredits[user.id] || '0');
                            if (credits > 0) {
                              updateUserCredits(user.id, credits);
                            }
                          }}
                          disabled={updatingCredits === user.id || !newCredits[user.id]}
                        >
                          {updatingCredits === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addFreeCredits(user.id, 50)}
                        disabled={updatingCredits === user.id}
                      >
                        +50 gratuits
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;
