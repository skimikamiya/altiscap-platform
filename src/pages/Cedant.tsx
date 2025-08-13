import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AltiscapLogo from '@/components/AltiscapLogo';
import { ArrowLeft, Upload, FileText, Building, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Cedant = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    revenue: '',
    employees: '',
    description: '',
    contactEmail: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Dossier créé avec succès !",
        description: "Votre dossier de vente a été enregistré et sera analysé par nos experts.",
      });
      
      // Reset form
      setFormData({
        companyName: '',
        industry: '',
        revenue: '',
        employees: '',
        description: '',
        contactEmail: '',
        phone: ''
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le dossier. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
                  <h1 className="text-2xl font-bold text-gray-900">Espace Cédant</h1>
                  <p className="text-sm text-gray-600">Créez votre dossier de vente d'entreprise</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <Card className="mb-8">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl text-gray-900 mb-4">
                  Vendez votre entreprise avec ALTISCAP
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Notre plateforme vous accompagne dans la valorisation et la vente de votre entreprise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="text-center">
                    <Building className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Valorisation précise</h3>
                    <p className="text-sm text-gray-600">Analyse complète de votre entreprise</p>
                  </div>
                  <div className="text-center">
                    <Users className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Réseau d'acheteurs</h3>
                    <p className="text-sm text-gray-600">Accès à des investisseurs qualifiés</p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Optimisation du prix</h3>
                    <p className="text-sm text-gray-600">Maximisez la valeur de votre entreprise</p>
          </div>
        </div>
              </CardContent>
            </Card>

            {/* Formulaire */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Créer votre dossier de vente</span>
                </CardTitle>
                <CardDescription>
                  Remplissez ce formulaire pour créer votre dossier de vente d'entreprise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Nom de votre entreprise"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industry">Secteur d'activité *</Label>
                      <Input
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        placeholder="Ex: Technologie, Commerce, Industrie"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="revenue">Chiffre d'affaires annuel (€)</Label>
                      <Input
                        id="revenue"
                        name="revenue"
                        type="number"
                        value={formData.revenue}
                        onChange={handleInputChange}
                        placeholder="Ex: 1000000"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="employees">Nombre d'employés</Label>
                      <Input
                        id="employees"
                        name="employees"
                        type="number"
                        value={formData.employees}
                        onChange={handleInputChange}
                        placeholder="Ex: 25"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description de l'entreprise *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Décrivez votre entreprise, ses activités, ses forces, ses perspectives..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email de contact *</Label>
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button type="submit" size="lg" className="px-8">
                      <Upload className="h-4 w-4 mr-2" />
                      Créer le dossier de vente
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Informations supplémentaires */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Comment ça marche ?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                      1
                      </div>
                    <div>
                      <h4 className="font-semibold">Création du dossier</h4>
                      <p className="text-sm text-gray-600">Remplissez le formulaire avec les informations de votre entreprise</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold">Analyse et valorisation</h4>
                      <p className="text-sm text-gray-600">Nos experts analysent votre entreprise et établissent une valorisation</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">Mise en relation</h4>
                      <p className="text-sm text-gray-600">Nous vous mettons en relation avec des acheteurs potentiels</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Cedant;
