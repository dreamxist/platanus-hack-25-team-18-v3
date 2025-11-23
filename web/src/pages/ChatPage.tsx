import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { getTopCandidate } from "@/data/mockData";
import { ChatContainer } from "@/components/organisms/ChatContainer";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/services/sessionService";

const ChatPage = () => {
  const navigate = useNavigate();
  const userId = getCurrentUserId();
  const { answers, candidates } = useAppContext();

  const topCandidate = getTopCandidate(answers, candidates);

  if (!topCandidate) {
    navigate('/');
    return null;
  }

  const handleReveal = async () => {
    if (!userId || !topCandidate.id) return;

    try {
      // Buscar el registro existente por userId y candidateId
      const { data: existingMatch, error: fetchError } = await supabase
        .from("UserMatches")
        .select("*")
        .eq("user_id", userId)
        .eq("candidate_id", topCandidate.id)
        .single();

      if (fetchError) {
        console.error("Error buscando UserMatches:", fetchError);
        // Continuar con la navegación aunque haya error
      } else if (existingMatch) {
        // Actualizar el status a 'revealed'
        const { error: updateError } = await supabase
          .from("UserMatches")
          .update({ status: "revealed" })
          .eq("user_id", userId)
          .eq("candidate_id", topCandidate.id);

        if (updateError) {
          console.error("Error actualizando UserMatches:", updateError);
          // Continuar con la navegación aunque haya error
        }
      }
    } catch (error) {
      console.error("Error al actualizar status:", error);
      // Continuar con la navegación aunque haya error
    }

    navigate('/reveal');
  };

  return (
    <div className="h-dvh flex flex-col bg-gradient-to-br from-white via-blue-50 to-red-50">
      {/* Header with blurred avatar */}
      <header className="w-full px-4 py-4 bg-card/80 backdrop-blur-lg border-b border-border/50 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="relative">
            <img
              src={topCandidate.avatarUrl}
              alt="Match"
              className="w-12 h-12 rounded-full blur-avatar"
            />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Tu match misterioso</h2>
            <p className="text-xs text-muted-foreground">
              Basado en tus respuestas hasta ahora
            </p>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col min-h-0">
          <ChatContainer
            candidateName={topCandidate.name}
            candidateId={topCandidate.id}
            onReveal={handleReveal}
            onBack={() => navigate('/swipe')}
          />
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
