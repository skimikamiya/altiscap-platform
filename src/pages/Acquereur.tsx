import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Shield, Search, CreditCard, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCredits } from "@/hooks/useCredits";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AltiscapLogo from "@/components/AltiscapLogo";

const Acquereur = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { credits, consumeCredits } = useCredits();
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const ANALYSIS_COST = 5; // Coût en crédits pour une analyse

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une URL valide",
        variant: "destructive",
      });
      return;
    }

    if (credits < ANALYSIS_COST) {
      toast({
        title: "Crédits insuffisants",
        description: `Il vous faut ${ANALYSIS_COST} crédits pour cette analyse. Achetez des crédits.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simuler une analyse IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Consommer les crédits
      await consumeCredits(ANALYSIS_COST);
      
      // Générer un rapport simulé
      const mockAnalysis = `
# Rapport de Due Diligence - ${url}

## 📊 Analyse Générale
Cette entreprise présente un profil intéressant pour une acquisition. L'analyse du site web révèle une structure commerciale solide.

## 🏢 Informations de l'Entreprise
- **Secteur d'activité** : Identifié via l'analyse du contenu
- **Présence en ligne** : Site web professionnel et optimisé
- **Positionnement** : Marché cible bien défini

## 💰 Indicateurs Financiers
- **Potentiel de croissance** : Élevé
- **Risques identifiés** : Faibles
- **Opportunités** : Marché en expansion

## 🔍 Recommandations
1. **Valider** les informations financières
2. **Vérifier** la propriété intellectuelle
3. **Analyser** la concurrence directe
4. **Évaluer** l'équipe de direction

## ⚠️ Points d'Attention
- Vérification des comptes annuels
- Analyse des contrats clients
- Évaluation des risques juridiques

---
*Rapport généré automatiquement par ALTISCAP AI*
      `;
      
      setAnalysis(mockAnalysis);
      
      toast({
        title: "Analyse terminée",
        description: `${ANALYSIS_COST} crédits ont été consommés. Rapport généré avec succès.`,
      });
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'analyse. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/" className="text-blue-600 hover:text-blue-700">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <AltiscapLogo size="lg" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Espace Acquéreur</h1>
                  <p className="text-sm text-gray-600">Due diligence automatisée et analyse de cibles</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {credits} crédits disponibles
                  </span>
                </div>
                <Link to="/pricing">
                  <Button variant="outline" size="sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Acheter des crédits
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          {/* Bouton de retour */}
          <div className="mb-6">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>

          {/* Informations sur les crédits */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Coût de l'analyse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                <span className="font-semibold text-blue-600">{ANALYSIS_COST} crédits</span> par analyse
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Votre solde actuel : <span className="font-medium">{credits} crédits</span>
              </p>
            </CardContent>
          </Card>

          {/* Formulaire d'analyse */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Analyse de Due Diligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="url">URL de l'entreprise à analyser</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://exemple.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Saisissez l'URL du site web de l'entreprise cible
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || credits < ANALYSIS_COST}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Lancer l'analyse ({ANALYSIS_COST} crédits)
                    </>
                  )}
                </Button>

                {credits < ANALYSIS_COST && (
                  <div className="text-center">
                    <p className="text-red-600 text-sm">
                      Crédits insuffisants. 
                      <Link to="/pricing" className="text-blue-600 hover:underline ml-1">
                        Achetez des crédits
                      </Link>
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Résultats de l'analyse */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Rapport d'analyse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {analysis}
                  </pre>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button 
                    onClick={() => {
                      const blob = new Blob([analysis], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `rapport-due-diligence-${Date.now()}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le rapport
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Acquereur;
