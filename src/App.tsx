import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Index from "./pages/Index";
import Cedant from "./pages/Cedant";
import Acquereur from "./pages/Acquereur";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Pricing from "./pages/Pricing";

const App = () => (
  <TooltipProvider>
    <AuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Routes protégées - nécessitent une authentification */}
          <Route path="/cedant" element={<Cedant />} />
          <Route path="/acquereur" element={<Acquereur />} />
          <Route path="/pricing" element={<Pricing />} />
          
          {/* Routes d'administration - réservées aux admins */}
          <Route path="/admin" element={<Admin />} />
          
          {/* Route de callback pour OAuth */}
          <Route path="/auth/callback" element={<Auth />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </TooltipProvider>
);

export default App;
