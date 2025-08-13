import React from 'react';
import { useAuth } from './AuthProvider';
import { useCredits } from '@/hooks/useCredits';
import { Navigate } from 'react-router-dom';
import { Loader2, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireCredits?: number;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireCredits = 0,
  adminOnly = false,
}) => {
  const { user, loading: authLoading } = useAuth();
  const { credits, loading: creditsLoading } = useCredits();

  // Attendre que l'authentification soit chargée
  if (authLoading || creditsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifier l'authentification
  if (requireAuth && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Vérifier les droits d'administration
  if (adminOnly && user?.user_metadata?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Accès refusé</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas les droits d'administration nécessaires pour accéder à cette page.
            </p>
            <Button onClick={() => window.history.back()}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vérifier les crédits
  if (requireCredits > 0 && credits < requireCredits) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CreditCard className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Crédits insuffisants</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Cette fonctionnalité nécessite {requireCredits} crédits, mais vous n'en avez que {credits}.
            </p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => window.location.href = '/pricing'}>
                Acheter des crédits
              </Button>
              <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
