import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { getCandidateAvatar } from "@/lib/images";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Database } from "@/integrations/supabase/types";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";

type Candidate = Database["public"]["Tables"]["Candidates"]["Row"];

interface CandidateResult {
  candidate: Candidate;
  count: number;
  percentage: number;
}

// Colores vibrantes para los gráficos
const CHART_COLORS = [
  "#8b5cf6", // Violeta
  "#3b82f6", // Azul
  "#10b981", // Verde
  "#f59e0b", // Ámbar
  "#ef4444", // Rojo
  "#ec4899", // Rosa
  "#06b6d4", // Cyan
  "#84cc16", // Lima
  "#f97316", // Naranja
  "#6366f1", // Índigo
];

// Función para obtener color basado en el ID del candidato
const getCandidateColor = (candidateId: number): string => {
  return CHART_COLORS[candidateId % CHART_COLORS.length];
};

export const VotingResults = () => {
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const candidatesRef = useRef<Candidate[]>([]);

  // Cargar candidatos una vez
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const { data, error } = await supabase
          .from("Candidates")
          .select("*")
          .order("id");

        if (error) throw error;
        if (data) {
          setCandidates(data);
          candidatesRef.current = data; // Mantener ref actualizado
        }
      } catch (error) {
        console.error("Error cargando candidatos:", error);
      }
    };

    loadCandidates();
  }, []);

  // Función para recargar los resultados (usando useCallback para mantener referencia estable)
  // Usa candidatesRef para evitar problemas de closure en los callbacks de realtime
  const reloadResults = useCallback(async () => {
    try {
      const { data: userMatches, error } = await supabase
        .from("UserMatches")
        .select("candidate_id")
        .eq("status", "revealed");

      if (error) {
        console.error("Error obteniendo UserMatches:", error);
        return;
      }

      const total = userMatches?.length || 0;
      setTotalVotes(total);

      // Contar votos por candidato
      const voteCounts = new Map<number, number>();
      userMatches?.forEach((match) => {
        if (match.candidate_id) {
          const current = voteCounts.get(match.candidate_id) || 0;
          voteCounts.set(match.candidate_id, current + 1);
        }
      });

      // Usar candidatesRef para obtener la versión más actualizada
      const currentCandidates = candidatesRef.current.length > 0 
        ? candidatesRef.current 
        : candidates;

      // Crear resultados con porcentajes
      const candidateResults: CandidateResult[] = currentCandidates.map((candidate) => {
        const count = voteCounts.get(candidate.id) || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return {
          candidate,
          count,
          percentage,
        };
      });

      // Ordenar por cantidad de votos (descendente)
      candidateResults.sort((a, b) => b.count - a.count);
      setResults(candidateResults);
    } catch (error) {
      console.error("Error recalculando resultados:", error);
    }
  }, [candidates]);

  // Cargar resultados iniciales y suscribirse a cambios en tiempo real
  useEffect(() => {
    if (candidates.length === 0) return;

    // Calcular resultados iniciales
    const loadInitialResults = async () => {
      try {
        const { data: userMatches, error } = await supabase
          .from("UserMatches")
          .select("candidate_id")
          .eq("status", "revealed");

        if (error) {
          console.error("Error obteniendo UserMatches:", error);
          throw error;
        }

        const total = userMatches?.length || 0;
        setTotalVotes(total);

        // Contar votos por candidato
        const voteCounts = new Map<number, number>();
        userMatches?.forEach((match) => {
          if (match.candidate_id) {
            const current = voteCounts.get(match.candidate_id) || 0;
            voteCounts.set(match.candidate_id, current + 1);
          }
        });

        // Crear resultados con porcentajes
        const candidateResults: CandidateResult[] = candidates.map((candidate) => {
          const count = voteCounts.get(candidate.id) || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return {
            candidate,
            count,
            percentage,
          };
        });
        
        // Actualizar ref también
        candidatesRef.current = candidates;

        // Ordenar por cantidad de votos (descendente)
        candidateResults.sort((a, b) => b.count - a.count);

        setResults(candidateResults);
        setIsLoading(false);
      } catch (error) {
        console.error("Error calculando resultados:", error);
        setIsLoading(false);
      }
    };

    // Cargar resultados iniciales
    loadInitialResults();

    // Configurar realtime con postgres_changes (websockets) para UserMatches
    // Usando filtro para solo recibir eventos cuando status = 'revealed'
    const channel = supabase
      .channel('user_matches_revealed_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'UserMatches',
          // FILTRO CRÍTICO: Solo notificar si la columna status es igual a 'revealed'
          filter: 'status=eq.revealed',
        },
        () => {
          // Cuando recibimos un UPDATE con status='revealed', recargar resultados
          reloadResults();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'UserMatches',
          // También filtrar INSERTs con status='revealed'
          filter: 'status=eq.revealed',
        },
        () => {
          // Cuando se inserta con status='revealed', recargar resultados
          reloadResults();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Suscripción exitosa - el filtro está activo
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('Error en realtime channel. Asegúrate de que la replicación esté habilitada para UserMatches.');
        }
      });

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [candidates, reloadResults]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando resultados...</p>
      </div>
    );
  }

  // Preparar datos para los gráficos
  const chartData = results.map((result) => ({
    name: result.candidate.name || "Candidato",
    votes: result.count,
    percentage: result.percentage,
    color: getCandidateColor(result.candidate.id),
    candidateId: result.candidate.id,
  }));

  const chartConfig = results.reduce((acc, result) => {
    acc[`candidate_${result.candidate.id}`] = {
      label: result.candidate.name || "Candidato",
      color: getCandidateColor(result.candidate.id),
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Resultados de Votaciones</h2>
        <p className="text-muted-foreground">
          Total de votos: <span className="font-semibold">{totalVotes}</span>
        </p>
        <button
          onClick={reloadResults}
          className="text-xs text-muted-foreground underline"
        >
          (Recargar manualmente)
        </button>
      </div>

      {totalVotes === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Aún no hay votos registrados
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Gráfico de Barras Vertical */}
          <Card>
            <CardHeader>
              <CardTitle>Votos por Candidato</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: data.color }}
                                  />
                                  <span className="font-medium">
                                    {data.name}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {data.votes} {data.votes === 1 ? "voto" : "votos"} ({data.percentage.toFixed(1)}%)
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="votes"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                      animationBegin={0}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Lista detallada de candidatos */}
          <div className="grid gap-4">
            {results.map((result) => (
              <Card key={result.candidate.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage
                        src={getCandidateAvatar(result.candidate.image)}
                        alt={result.candidate.name || "Candidato"}
                      />
                      <AvatarFallback>
                        {result.candidate.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {result.candidate.name || "Candidato sin nombre"}
                      </CardTitle>
                      {result.candidate.political_party && (
                        <p className="text-sm text-muted-foreground">
                          {result.candidate.political_party}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold transition-all duration-500 ease-out">
                        {result.percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground transition-all duration-500 ease-out">
                        {result.count} {result.count === 1 ? "voto" : "votos"}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <ProgressBar
                      current={result.count}
                      total={totalVotes}
                      className="w-full"
                    />
                    <div
                      className="h-2 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${result.percentage}%`,
                        backgroundColor: getCandidateColor(result.candidate.id),
                        transition: 'width 0.7s ease-out, background-color 0.3s ease-out',
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

