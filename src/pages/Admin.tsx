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

interface GlobalSetting {
  key: string;
  value: string;
  description: string;
}

const Admin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingCredits, setUpdatingCredits] = useState<string | null>(null);
  const [updatingSettings, setUpdatingSettings] = useState<string | null>(null);
  const [newCredits, setNewCredits] = useState<{ [key: string]: string }>({});
  const [newSettings, setNewSettings] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadUsers(), loadGlobalSettings()]);
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
      // Récupérer tous les utilisateurs avec leurs crédits
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;

      // Récupérer les crédits de chaque utilisateur
      const usersWithCredits = await Promise.all(
        usersData.users.map(async (user) => {
          try {
            const { data: creditsData } = await (supabase as any).rpc('get_user_credits', {
              user_id_param: user.id
            });
            
            return {
              id: user.id,
              email: user.email || 'Email non disponible',
              credits: creditsData && creditsData.length > 0 ? creditsData[0].credits : 0,
              created_at: user.created_at
            };
          } catch (error) {
            return {
              id: user.id,
              email: user.email || 'Email non disponible',
              credits: 0,
              created_at: user.created_at
            };
          }
        })
      );

      setUsers(usersWithCredits);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const loadGlobalSettings = async () => {
    try {
      const { data, error } = await (supabase as any).rpc('get_global_settings');
      
      if (error) throw error;
      
      if (data) {
        const settings = data.map((setting: any) => ({
          key: setting.key,
          value: setting.value,
          description: setting.description
        }));
        setGlobalSettings(settings);
        
        // Initialiser les champs d'édition
        const initialSettings: { [key: string]: string } = {};
        settings.forEach(setting => {
          initialSettings[setting.key] = setting.value;
        });
        setNewSettings(initialSettings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres globaux:', error);
    }
  };

  const updateUserCredits = async (userId: string, newCredits: number) => {
    try {
      setUpdatingCredits(userId);
      
      // Utiliser la fonction RPC pour mettre à jour les crédits
      const { error } = await (supabase as any).rpc('update_user_credits', {
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
      
      // Utiliser la fonction RPC pour ajouter des crédits
      const { error } = await (supabase as any).rpc('add_user_credits', {
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

  const updateGlobalSetting = async (key: string, newValue: string) => {
    try {
      setUpdatingSettings(key);
      
      // Mettre à jour le paramètre global
      const { error } = await (supabase as any)
        .from('global_settings')
        .update({ value: newValue })
        .eq('key', key);
      
      if (error) throw error;
      
      // Mettre à jour la liste locale
      setGlobalSettings(prevSettings => 
        prevSettings.map(setting => 
          setting.key === key ? { ...setting, value: newValue } : setting
        )
      );
      
      toast({
        title: "Succès",
        description: `Paramètre ${key} mis à jour`,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paramètre",
        variant: "destructive",
      });
    } finally {
      setUpdatingSettings(null);
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

          {/* Paramètres globaux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Paramètres globaux</span>
              </CardTitle>
              <CardDescription>
                Configurez les paramètres de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {globalSettings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{setting.key}</p>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={newSettings[setting.key] || setting.value}
                        onChange={(e) => setNewSettings(prev => ({ ...prev, [setting.key]: e.target.value }))}
                        className="w-32"
                      />
                      <Button
                        size="sm"
                        onClick={() => updateGlobalSetting(setting.key, newSettings[setting.key] || setting.value)}
                        disabled={updatingSettings === setting.key}
                      >
                        {updatingSettings === setting.key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
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
