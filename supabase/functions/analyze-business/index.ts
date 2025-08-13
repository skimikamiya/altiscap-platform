import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessType, revenue, profit, age, churn, description } = await req.json();
    
    console.log('Starting business analysis for:', businessType);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use anonymous user since function is public
    const user = { id: crypto.randomUUID() };

    // Get API key for AI analysis
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      console.error('OpenRouter API key not configured');
      throw new Error('OpenRouter API key not configured');
    }

    console.log('OpenRouter API key found, proceeding with analysis...');

    // Calculate basic metrics
    const profitMargin = revenue > 0 ? (profit / revenue * 100) : 0;
    const revenueMultiplier = businessType === 'saas' ? 8 : businessType === 'ecommerce' ? 3 : 5;
    const baseValuation = revenue * revenueMultiplier;
    
    // Analyze with AI
    console.log('Analyzing business with AI...');
    const analysisPrompt = `
Vous êtes un expert en évaluation d'entreprises et en préparation de dossiers de cession. Analysez les données suivantes pour créer un rapport de valorisation professionnel.

Données de l'entreprise:
- Type d'activité: ${businessType}
- Chiffre d'affaires: ${revenue}€
- Bénéfice net: ${profit}€
- Âge de l'entreprise: ${age} ans
- Taux de désabonnement: ${churn}%
- Description: ${description}

Métriques calculées:
- Marge bénéficiaire: ${profitMargin.toFixed(1)}%
- Valorisation de base: ${baseValuation.toLocaleString()}€

Fournissez une analyse complète sous format JSON avec la structure suivante:
{
  "valorisation": {
    "valeur_minimale": 1000000,
    "valeur_optimale": 1500000,
    "valeur_maximale": 2000000,
    "methode_valorisation": "Multiple de CA ajusté",
    "justification": "Explication de la valorisation"
  },
  "forces_cles": ["Force 1", "Force 2", "Force 3"],
  "points_amelioration": ["Point 1", "Point 2"],
  "analyse_financiere": {
    "marge_beneficiaire": ${profitMargin},
    "croissance_estimee": "15%",
    "qualite_revenus": "Récurrents",
    "saisonnalite": "Faible"
  },
  "positionnement_marche": {
    "taille_marche": "500M€",
    "part_marche": "0.2%",
    "concurrence": "Modérée",
    "barriere_entree": "Moyenne"
  },
  "risques": ["Risque 1", "Risque 2", "Risque 3"],
  "recommandations_cession": ["Recommandation 1", "Recommandation 2"],
  "timeline_cession": {
    "preparation": "2-3 mois",
    "commercialisation": "4-6 mois",
    "negociation": "1-2 mois"
  },
  "score_attractivite": 85
}

Répondez uniquement avec le JSON, sans texte supplémentaire.`;

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': `https://gvcctjmxelxirczyessq.supabase.co`,
        'X-Title': 'Altiscap - Business Analysis'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    console.log('OpenRouter API response status:', aiResponse.status);

    let aiData: any;

    if (aiResponse.ok) {
      aiData = await aiResponse.json();
    } else {
      const errorText = await aiResponse.text();
      console.error('OpenRouter API error:', aiResponse.status, errorText);

      // Fallback to a free model if available
      if ([400, 402, 403, 429, 503].includes(aiResponse.status)) {
        console.log('Attempting fallback with free model: meta-llama/llama-3.1-8b-instruct:free');
        const fallbackResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': `https://gvcctjmxelxirczyessq.supabase.co`,
            'X-Title': 'Altiscap - Business Analysis (fallback)'
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages: [
              { role: 'user', content: analysisPrompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        });

        console.log('Fallback OpenRouter response status:', fallbackResp.status);

        if (fallbackResp.ok) {
          aiData = await fallbackResp.json();
        } else {
          const fbText = await fallbackResp.text();
          console.error('Fallback OpenRouter API error:', fallbackResp.status, fbText);
          return new Response(JSON.stringify({ 
            error: 'Le service IA est indisponible actuellement. Veuillez réessayer plus tard.',
            success: false
          }), {
            status: 200, // Return 200 but with error in body
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        throw new Error(`OpenRouter API failed: ${aiResponse.status} - ${errorText}`);
      }
    }

    let analysisResult;
    
    try {
      analysisResult = JSON.parse(aiData.choices[0].message.content);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      // Fallback structured response
      analysisResult = {
        valorisation: {
          valeur_minimale: Math.round(baseValuation * 0.8),
          valeur_optimale: Math.round(baseValuation),
          valeur_maximale: Math.round(baseValuation * 1.2),
          methode_valorisation: "Multiple de CA",
          justification: "Valorisation basée sur les multiples sectoriels"
        },
        forces_cles: ["Rentabilité positive", "Activité stable"],
        points_amelioration: ["Optimisation des marges"],
        score_attractivite: 75
      };
    }

    // Save analysis to database
    console.log('Saving business analysis to database...');
    let analysisData: any = null;
    const { data: insertData, error: dbError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        type: 'business',
        title: `Valorisation ${businessType}`,
        input_data: { businessType, revenue, profit, age, churn, description },
        result: analysisResult
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error (non-blocking):', dbError);
    } else {
      analysisData = insertData;
    }

    console.log('Business analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      analysisId: analysisData?.id ?? null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-business function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});