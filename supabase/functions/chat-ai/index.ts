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
    const { message, conversationId, context, deviceId } = await req.json();
    
    console.log('Processing AI chat message:', message);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to get user from auth header (optional)
    const authHeader = req.headers.get('Authorization') || '';
    let user: any = null;
    try {
      if (authHeader.startsWith('Bearer ')) {
        const { data, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (!authError && data?.user) {
          user = data.user;
        } else {
          console.warn('Auth present but invalid, proceeding unauthenticated');
        }
      }
    } catch (e) {
      console.warn('Auth lookup failed, proceeding unauthenticated');
    }

    // Get or create conversation (only for authenticated users)
    let conversation: any = null;
    if (user && conversationId) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      conversation = data || null;
    }

    if (user && !conversation) {
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + '...',
          messages: []
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create conversation:', createError);
      } else {
        conversation = newConversation;
      }
    }

    // Get API key for AI
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Prepare conversation history
    const conversationHistory = conversation?.messages || [];
    
    // System prompt for Altiscap AI assistant
    const systemPrompt = `Vous êtes l'assistant IA d'Altiscap, une plateforme spécialisée dans les opérations de fusion-acquisition.

Votre rôle:
- Aider les utilisateurs avec leurs questions sur l'évaluation d'entreprises
- Expliquer les métriques financières et les multiples de valorisation
- Conseiller sur les processus de due diligence
- Analyser les risques et opportunités d'acquisition
- Guider sur la préparation de dossiers de cession

Contexte additionnel: ${context || 'Aucun contexte spécifique'}

Répondez de manière professionnelle, précise et constructive. Utilisez votre expertise en finance d'entreprise et M&A.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    console.log('Sending request to AI...');
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': `https://gvcctjmxelxirczyessq.supabase.co`,
        'X-Title': 'Altiscap - AI Chat'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    // Update conversation with new messages
    const updatedMessages = [
      ...conversationHistory,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiMessage, timestamp: new Date().toISOString() }
    ];

    if (user && conversation?.id) {
      console.log('Updating conversation in database...');
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      if (updateError) {
        console.error('Failed to update conversation:', updateError);
      }
    }

    console.log('AI chat response generated successfully');

    return new Response(JSON.stringify({
      success: true,
      response: aiMessage,
      conversationId: conversation?.id || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});