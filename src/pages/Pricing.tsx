import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Shield, Zap, Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCredits } from '@/hooks/useCredits';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StripePayment } from '@/components/payment/StripePayment';
import AltiscapLogo from '@/components/AltiscapLogo';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits } = useCredits();

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <header className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour à l'accueil</span>
              </Button>
            </div>
            <AltiscapLogo size="md" />
          </div>

          {/* Titre et solde de crédits */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Achetez des Crédits
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Choisissez le pack qui correspond à vos besoins et commencez à analyser 
              des opportunités d'acquisition dès aujourd'hui.
            </p>
            
            {user && (
              <div className="inline-flex items-center space-x-3 bg-white px-6 py-3 rounded-lg shadow-sm">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-medium text-gray-700">
                  Solde actuel : {credits} crédits
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Composant de paiement Stripe */}
        <main className="container mx-auto px-6 pb-16">
          <StripePayment />
        </main>

        {/* Section FAQ */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Questions Fréquentes
              </h2>
              <p className="text-lg text-gray-600">
                Tout ce que vous devez savoir sur nos crédits
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <span>Comment fonctionnent les crédits ?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Chaque analyse consomme 5 crédits. Les crédits sont valables 1 an 
                    et peuvent être utilisés pour toutes les fonctionnalités de la plateforme.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>Les crédits sont-ils sécurisés ?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Oui, tous les paiements sont sécurisés via Stripe. Vos informations 
                    de paiement ne sont jamais stockées sur nos serveurs.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Crédits gratuits pour nouveaux utilisateurs</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Chaque nouvel utilisateur reçoit automatiquement 50 crédits gratuits 
                    pour tester la plateforme sans engagement.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                    <span>Remboursement possible ?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Les crédits non utilisés peuvent être remboursés dans les 30 jours 
                    suivant l'achat, sous réserve de conditions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
          <div className="container mx-auto px-6 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Prêt à commencer ?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Rejoignez des milliers d'entrepreneurs qui utilisent ALTISCAP 
              pour leurs fusions et acquisitions.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/')}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Découvrir la plateforme
            </Button>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
};

export default Pricing;
