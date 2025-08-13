import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCredits } from '@/hooks/useCredits';
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price_euros: number;
  popular?: boolean;
  features: string[];
}

export const StripePayment: React.FC = () => {
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();
  const { addCredits, credits } = useCredits();

  // Charger les packs de crédits depuis Supabase
  useEffect(() => {
    loadCreditPacks();
  }, []);

  const loadCreditPacks = async () => {
    try {
      setLoadingPacks(true);
      const { data, error } = await supabase.rpc('get_credit_packs');
      
      if (error) throw error;
      
      if (data) {
        const packs = data.map((pack: any) => ({
          id: pack.id,
          name: pack.name,
          credits: pack.credits,
          price_euros: pack.price_euros,
          popular: pack.popular,
          features: pack.features || []
        }));
        setCreditPacks(packs);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des packs:', error);
      // Fallback vers des packs par défaut
      setCreditPacks([
        {
          id: 'starter',
          name: 'Pack Découverte',
          credits: 100,
          price_euros: 10.00,
          features: ['100 crédits', 'Support email']
        },
        {
          id: 'professional',
          name: 'Pack Professionnel',
          credits: 500,
          price_euros: 45.00,
          popular: true,
          features: ['500 crédits', 'Support prioritaire', 'Rapports détaillés']
        },
        {
          id: 'enterprise',
          name: 'Pack Entreprise',
          credits: 2000,
          price_euros: 150.00,
          features: ['2000 crédits', 'Support dédié', 'API access', 'Rapports personnalisés']
        }
      ]);
    } finally {
      setLoadingPacks(false);
    }
  };

  const handlePurchase = async (pack: CreditPack) => {
    setSelectedPack(pack);
    setLoading(true);
    
    try {
      // Simulation d'un processus de paiement Stripe
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ajouter les crédits via Supabase
      const success = await addCredits(pack.credits, `Achat du pack ${pack.name}`);
      
      if (success) {
        setPaymentSuccess(true);
        toast({
          title: "Paiement réussi !",
          description: `${pack.credits} crédits ont été ajoutés à votre compte.`,
        });
        
        // Enregistrer l'achat dans Supabase
        try {
          await supabase.from('credit_purchases').insert({
            pack_id: pack.id,
            credits: pack.credits,
            amount_euros: pack.price_euros.toString(),
            status: 'completed'
          });
        } catch (error) {
          console.error('Erreur lors de l\'enregistrement de l\'achat:', error);
        }
      } else {
        throw new Error('Impossible d\'ajouter les crédits');
      }
    } catch (error) {
      console.error('Erreur lors de l\'achat:', error);
      toast({
        title: "Erreur de paiement",
        description: "Une erreur s'est produite lors du traitement du paiement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedPack(null);
    setPaymentSuccess(false);
  };

  if (loadingPacks) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement des packs de crédits...</span>
      </div>
    );
  }

  if (selectedPack && !paymentSuccess) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span>Confirmer l'achat</span>
          </CardTitle>
          <CardDescription>
            Vous êtes sur le point d'acheter le pack {selectedPack.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">{selectedPack.name}</span>
              <span className="text-2xl font-bold text-blue-600">
                {selectedPack.price_euros}€
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {selectedPack.credits} crédits
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={() => handlePurchase(selectedPack)}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Confirmer l'achat
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={loading}
              className="w-full"
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentSuccess) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Paiement réussi !</h3>
          <p className="text-gray-600 mb-4">
            {selectedPack?.credits} crédits ont été ajoutés à votre compte.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Nouveau solde : {credits} crédits
          </p>
          <Button onClick={handleReset} className="w-full">
            Acheter d'autres crédits
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choisissez votre pack de crédits
        </h2>
        <p className="text-gray-600">
          Achetez des crédits pour continuer à utiliser ALTISCAP
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creditPacks.map((pack) => (
          <Card 
            key={pack.id} 
            className={`relative ${pack.popular ? 'ring-2 ring-blue-500' : ''}`}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Populaire
                </span>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{pack.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-blue-600">
                  {pack.price_euros}€
                </span>
                <br />
                <span className="text-lg text-gray-600">
                  {pack.credits} crédits
                </span>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {pack.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Button 
                onClick={() => setSelectedPack(pack)}
                className="w-full"
                variant={pack.popular ? "default" : "outline"}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Acheter maintenant
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>💳 Paiement sécurisé via Stripe</p>
        <p>🔄 Remboursement sous 30 jours</p>
        <p>🔒 Vos données sont protégées</p>
      </div>
    </div>
  );
};
