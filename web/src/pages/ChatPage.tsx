import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { getTopCandidate } from "@/data/mockData";
import { ChatContainer } from "@/components/organisms/ChatContainer";
import { supabase } from "@/integrations/supabase/client";

const ChatPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const { answers, candidates } = useAppContext();

  const topCandidate = getTopCandidate(answers, candidates);

  if (!topCandidate) {
    navigate(`/?userId=${userId}`);
    return null;
  }

  const handleReveal = async () => {
    if (!userId || !topCandidate.id) return;

    try {
      // Crear o actualizar el registro en UserMatches con status 'revealed'
      // Usamos upsert para crear si no existe o actualizar si ya existe
      const { error } = await supabase
        .from("UserMatches")
        .upsert(
          {
            user_id: userId,
            candidate_id: topCandidate.id,
            status: "revealed",
          },
          {
            onConflict: "user_id,candidate_id",
          }
        );

      if (error) {
        console.error("Error actualizando UserMatches:", error);
        // Continuar con la navegación aunque haya error
      }
    } catch (error) {
      console.error("Error al actualizar status:", error);
      // Continuar con la navegación aunque haya error
    }

    navigate(`/reveal?userId=${userId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-blue-50 to-red-50">
      {/* Header with blurred avatar */}
      <header className="w-full px-4 py-4 bg-card/80 backdrop-blur-lg border-b border-border/50">
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
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col">
          <ChatContainer
            candidateName={topCandidate.name}
            candidateId={topCandidate.id}
            onReveal={handleReveal}
            onBack={() => navigate(`/swipe?userId=${userId}`)}
          />
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
