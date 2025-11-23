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
    // ----------------------------------------------------
    // PASO A: RECUPERAR OPINIONS
    // ----------------------------------------------------
    const { data: opinions, error: opinionsError } = await supabase
      .from("Opinions")
      .select('id, text')
      .is('asseveration', null);

    if (opinionsError) throw opinionsError;

    const BATCH_SIZE = 2;
    const systemPrompt = `
Debes realizar una única aseveración. Esta debe ser lo más equivalente posible a la opinión política provista, pero neutra, tal que el encuestado no pueda discernir, distinguir ni ser influenciado por el formato de la aseveración.
Reglas estrictas:
- Se breve y directo. Responde en 1 frase.
- Escribe en texto plano, sin markdown.
`;

    // Procesar opiniones en lotes de 2
    for (let batchStart = 0; batchStart < opinions.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, opinions.length);
      const batch = opinions.slice(batchStart, batchEnd);

      // Procesar todo el lote en paralelo
      await Promise.all(
        batch.map(async (opinion: { id: string; text: string }) => {
          // ----------------------------------------------------
          // PASO B: LLAMADA A ANTHROPIC (Claude)
          // ----------------------------------------------------
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
          // PASO C: ACTUALIZAR OPINION CON ASSEVERATION
          // ----------------------------------------------------
          const { error: updateError } = await supabase
            .from("Opinions")
            .update({ asseveration: llmResponse })
            .eq('id', opinion.id);

          if (updateError) throw updateError;
        })
      );
    }
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });

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
