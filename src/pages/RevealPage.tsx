import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { getTopCandidate } from "@/data/mockData";
import { StatsPanel } from "@/components/organisms/StatsPanel";
import { toast } from "sonner";

const RevealPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const { answers, resetApp, candidates, ideas } = useAppContext();

  const topCandidate = getTopCandidate(answers, candidates);

  if (!topCandidate) {
    navigate(`/?userId=${userId}`);
    return null;
  }

  const handleShare = () => {
    toast.success("¡Link copiado!", {
      description: "Comparte tu match con tus amigos",
    });
  };

  const handleRestart = () => {
    resetApp();
    navigate(`/?userId=${userId}`);
  };

  return (
    <div className="h-screen w-full fixed inset-0 overflow-hidden bg-gradient-to-br from-white via-blue-50 to-red-50">
      <div className="h-full w-full overflow-y-auto pb-8">
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          {/* Avatar section - Only image */}
          <div className="flex flex-col items-center justify-center pt-8 animate-scale-in">
            <div className="relative mb-6">
              <img
                src={topCandidate.avatarUrl}
                alt={topCandidate.name}
                className="w-48 h-48 rounded-full shadow-glow animate-fade-in border-4 border-primary/20"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-primary/5 animate-pulse" />
            </div>
          </div>

          {/* Stats panel with name and share button */}
          <div className="animate-slide-up-from-bottom">
            <StatsPanel
              candidate={topCandidate}
              answers={answers}
              ideas={ideas}
              onShare={handleShare}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RevealPage;
