/// <reference path="./deno.d.ts" />
// @ts-ignore - Deno imports from URLs
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore - Deno imports from URLs
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

// --- 1. Inicialización de Clientes ---
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

// Cliente Anthropic para generación de respuestas
const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? ''
});

// --- 3. Función Principal de la Edge Function ---
Deno.serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Método no permitido', {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const { opinion_id } = await req.json();

    if (!opinion_id) {
      return new Response(
        JSON.stringify({
          error: 'Falta opinion_id'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // ----------------------------------------------------
    // PASO A: RECUPERAR OPINION
    // ----------------------------------------------------
    const { data: opinions, error: opinionsError } = await supabase
      .from("Opinions")
      .select('text')
      .eq('id', opinion_id);

    if (opinionsError) throw opinionsError;

    const opinion = opinions[0]

    // ----------------------------------------------------
    // PASO B: LLAMADA A ANTHROPIC (Claude)
    // ----------------------------------------------------
    const systemPrompt = `
Debes realizar una única aseveración. Esta debe ser lo más equivalente posible a la opinión política provista, pero neutra, tal que el encuestado no pueda discernir, distinguir ni ser influenciado por el formato de la aseveración.
Reglas estrictas:
- Se breve y directo. Responde en 1 frase.
- Escribe en texto plano, sin markdown.
`;

    // Llamada a Anthropic Claude
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{
        role: "user" as const,
        content: opinion.text
      }]
    });

    // Anthropic devuelve el contenido en un array de bloques
    const llmResponse = completion.content[0].type === 'text' 
      ? completion.content[0].text 
      : '';

    // ----------------------------------------------------
    // PASO E: RESPUESTA FINAL
    // ----------------------------------------------------
    return new Response(
      JSON.stringify({
        response: llmResponse
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Error en la Edge Function:', error);
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
