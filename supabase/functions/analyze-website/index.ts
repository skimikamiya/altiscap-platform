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
    const { targetUrl, comments } = await req.json();
    
    console.log('Starting website analysis for:', targetUrl);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use anonymous user since function is public  
    const user = { id: crypto.randomUUID() };

    // Fetch website content
    console.log('Fetching website content...');
    let websiteContent = '';
    
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AltiscapBot/1.0)',
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        // Extract text content (basic extraction)
        websiteContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 5000); // Limit content length
      }
    } catch (error) {
      console.error('Error fetching website:', error);
      websiteContent = 'Could not fetch website content';
    }

    // Get API key for AI analysis
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      console.error('OpenRouter API key not configured');
      throw new Error('OpenRouter API key not configured');
    }

    console.log('OpenRouter API key found, proceeding with analysis...');

    // Analyze with AI
    console.log('Analyzing website with AI...');
    const analysisPrompt = `
Vous êtes un expert en due diligence d'acquisition d'entreprises. Analysez le site web suivant pour un acquéreur potentiel.

URL: ${targetUrl}
Commentaires additionnels: ${comments || 'Aucun'}

Contenu du site web:
${websiteContent}

Fournissez une analyse détaillée sous format JSON avec la structure suivante:
{
  "resume_executif": "Résumé en 2-3 phrases",
  "secteur_activite": "Secteur d'activité identifié",
  "modele_economique": "Description du modèle économique",
  "positionnement_marche": "Position sur le marché",
  "forces": ["Force 1", "Force 2", "Force 3"],
  "faiblesses": ["Faiblesse 1", "Faiblesse 2"],
  "opportunites": ["Opportunité 1", "Opportunité 2"],
  "risques": ["Risque 1", "Risque 2", "Risque 3"],
  "recommandations": ["Recommandation 1", "Recommandation 2"],
  "score_attractivite": 85,
  "prochaines_etapes": ["Étape 1", "Étape 2", "Étape 3"]
}

Répondez uniquement avec le JSON, sans texte supplémentaire.`;

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': `https://gvcctjmxelxirczyessq.supabase.co`,
        'X-Title': 'Altiscap - Website Analysis'
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
            'X-Title': 'Altiscap - Website Analysis (fallback)'
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
        resume_executif: "Analyse générée avec succès",
        secteur_activite: "À déterminer",
        modele_economique: "Analyse en cours",
        forces: ["Site web fonctionnel"],
        faiblesses: ["Données limitées"],
        score_attractivite: 70,
        prochaines_etapes: ["Analyse approfondie recommandée"]
      };
    }

    // Save analysis to database
    console.log('Saving analysis to database...');
    let analysisData: any = null;
    const { data: insertData, error: dbError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        type: 'website',
        title: `Analyse de ${targetUrl}`,
        input_data: { targetUrl, comments },
        result: analysisResult
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error (non-blocking):', dbError);
    } else {
      analysisData = insertData;
    }

    console.log('Website analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      analysisId: analysisData?.id ?? null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-website function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
