import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AltiscapLogo from '@/components/AltiscapLogo';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);

  // Lire le paramètre mode de l'URL
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
          <AltiscapLogo size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Connexion' : 'Création de compte'}
          </h1>
          <p className="text-gray-600">
            {isLogin 
              ? 'Accédez à votre compte' 
              : 'Rejoignez-nous et recevez 50 crédits gratuits'
            }
          </p>
        </div>

        {/* Formulaire */}
        {isLogin ? <LoginForm /> : <SignUpForm />}

        {/* Bascule entre login et signup */}
        <Card className="mt-6">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
            </p>
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Créer un compte" : "Se connecter"}
            </Button>
          </CardContent>
        </Card>

        {/* Informations supplémentaires */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>En continuant, vous acceptez nos conditions d'utilisation</p>
          <p>et notre politique de confidentialité</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
