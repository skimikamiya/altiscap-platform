import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCredits } from '@/hooks/useCredits';
import AltiscapLogo from '@/components/AltiscapLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, UserPlus, ArrowRight, Building, Users, TrendingUp } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useAuth();
  const { credits } = useCredits();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (user) {
    // Utilisateur connecté - Afficher le dashboard
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <AltiscapLogo size="xl" className="mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Bienvenue, {user.email}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Votre plateforme de M&A digital pour due diligence, valorisation et dossiers de vente
            </p>
            <div className="bg-blue-50 p-4 rounded-lg inline-block">
              <p className="text-blue-800 font-semibold">
                💰 Crédits disponibles : {credits}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Building className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <CardTitle>Due Diligence IA</CardTitle>
                <CardDescription>
                  Analysez des entreprises avec l'intelligence artificielle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/acquereur">
                  <Button className="w-full">
                    Accéder <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <CardTitle>Espace Cédant</CardTitle>
                <CardDescription>
                  Créez votre dossier de vente d'entreprise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/cedant">
                  <Button className="w-full">
                    Accéder <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <CardTitle>Gérer mes crédits</CardTitle>
                <CardDescription>
                  Achetez des crédits et suivez vos transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/pricing">
                  <Button className="w-full">
                    Accéder <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" onClick={handleSignOut}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Utilisateur non connecté - Page de connexion simple
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <AltiscapLogo size="xl" className="mx-auto mb-6" />
          <p className="text-lg text-gray-600 mb-2">
            Plateforme de M&A digital
          </p>
          <p className="text-sm text-gray-500">
            Due diligence • Valorisation • Dossiers de vente
          </p>
        </div>

        {/* Options de connexion */}
        <div className="space-y-4">
          <Link to="/auth?mode=login">
            <Button className="w-full" size="lg">
              <LogIn className="h-5 w-5 mr-2" />
              Se connecter
            </Button>
          </Link>

          <Link to="/auth?mode=signup">
            <Button variant="outline" className="w-full" size="lg">
              <UserPlus className="h-5 w-5 mr-2" />
              Créer un compte
            </Button>
          </Link>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>50 crédits gratuits offerts à l'inscription</p>
        </div>
      </div>
    </div>
  );
};

export default Index;