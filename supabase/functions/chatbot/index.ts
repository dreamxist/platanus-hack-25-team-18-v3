// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./deno.d.ts" />
// @ts-expect-error - Deno imports from URLs
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-expect-error - Deno imports from URLs
import { OpenAI } from 'https://esm.sh/openai@4.47.1';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

// --- 1. Inicialización de Clientes ---
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

// Cliente OpenAI para embeddings
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY') ?? ''
});

// Cliente Anthropic para generación de respuestas
const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? ''
});

// --- 2. Implementación de la Generación de Embeddings (OpenAI) ---
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Genera el embedding de un texto usando la API de OpenAI.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input: [text]
    });
    return response.data[0].embedding;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al llamar OpenAI:', errorMessage);
    throw new Error(`Fallo en la generación de embedding: ${errorMessage}`);
  }
}

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
    const { prompt, conversation_id } = await req.json();

    if (!prompt || !conversation_id) {
      return new Response(
        JSON.stringify({
          error: 'Faltan prompt o conversation_id'
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
    // PASO A: RECUPERAR HISTORIAL DE CONVERSACIÓN
    // ----------------------------------------------------
    const { data: messages, error: messagesError } = await supabase
      .from("Messages")
      .select('role, text')
      .eq('conversation_id', conversation_id)
      .order('id', { ascending: true });

    if (messagesError) throw messagesError;

    // Limitar el historial a los últimos 10 mensajes (5 intercambios)
    // Esto reduce tokens y costos, manteniendo contexto reciente
    const MAX_HISTORY_MESSAGES = 10;
    const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);

    const chatMessages = recentMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.text
    }));

    // ----------------------------------------------------
    // PASO B: RAG — GENERAR EMBEDDING Y HACER MATCH
    // ----------------------------------------------------
    const promptEmbedding = await generateEmbedding(prompt);

    const { data: hist, error: histErr } = await supabase
      .from("Conversations")
      .select('candidate_id')
      .eq('id', conversation_id)
      .limit(1);

    if (histErr) throw histErr;

    let context = "";
    let candidate_id = null;

    if (hist?.length) {
      candidate_id = hist[0].candidate_id;

      const embeddingString = `[${promptEmbedding.join(',')}]`;

      const { data: docs, error: ragErr } = await supabase.rpc(
        'match_documents_by_candidate',
        {
          query_embedding: embeddingString,
          candidate_filter_id: candidate_id,
          match_count: 5
        }
      );

      if (ragErr) throw ragErr;
      context = docs?.map((d) => d.text).join("\n\n") || "";
    }

    // ----------------------------------------------------
    // PASO C: LLAMADA A ANTHROPIC (Claude)
    // ----------------------------------------------------
    const systemPrompt = `
Eres un postulante a la elección presidencial de Chile conversando directamente con un ciudadano.
Tu única fuente de información oficial son los datos proporcionados en el "Contexto del Candidato (RAG)".
Debes responder como el candidato: con claridad, respeto, coherencia y basándote únicamente en tus propias declaraciones incluidas en el RAG.
Reglas estrictas:
- No inventes propuestas, opiniones, cifras ni posiciones que no estén en el RAG.
- Si el ciudadano pregunta por algo que no aparece en el RAG, responde de manera natural que no tienes información sobre ese tema. En caso que sea algo evidentemente lejano a la política, responde con humor, se breve y no te salgas del personaje político.
- Luego, si es apropiado, puedes agregar una reflexión general NO factual (ej: valores, principios) sin inventar datos.
- Mantén un tono cercano, directo y humano, como un candidato hablando con una persona.
- Habla siempre en primera persona ("yo propongo", "mi visión es", etc.).
- No tomes posiciones que contradigan el RAG.
- Si el RAG contiene múltiples opiniones relacionadas, únelas coherentemente.
- Si el usuario pide tu postura sobre algo sensible y no aparece en el RAG, evade de manera natural la pregunta y guialo a otros temas politicos relacionados que si poseas información.
- Nunca menciones al RAG ni digas que eres un modelo. Actúa como el candidato.
- Se breve y directo. Responde en menos de 5 frases.
- Escribe en texto plano, sin markdown.
Contexto del Candidato (RAG):
---
${context}
`;

    // Formatear mensajes para Anthropic (no incluye system como mensaje)
    const messagesToSend = [
      ...chatMessages,
      {
        role: "user" as const,
        content: prompt
      }
    ];

    // Llamada a Anthropic Claude
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messagesToSend
    });

    // Anthropic devuelve el contenido en un array de bloques
    const llmResponse = completion.content[0].type === 'text' 
      ? completion.content[0].text 
      : '';

    // ----------------------------------------------------
    // PASO D: GUARDAR MEMORIA EN SUPABASE
    // ----------------------------------------------------
    await supabase.from('Messages').insert({
      conversation_id,
      text: prompt,
      role: 'user'
    });

    await supabase.from('Messages').insert({
      conversation_id,
      text: llmResponse,
      role: 'assistant'
    });

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en la Edge Function:', error);
    return new Response(
      JSON.stringify({
        error: errorMessage
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
