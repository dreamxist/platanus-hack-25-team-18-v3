import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { getTopCandidate, getCandidateScore, getTopicScores } from "@/data/mockData";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Share2, X, Bell } from "lucide-react";

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

  const overallScore = getCandidateScore(topCandidate.id, answers);
  const topicScores = getTopicScores(topCandidate.id, answers, ideas);

  // Get topics where there's a match (score >= 50%)
  const matchedTopics = Object.entries(topicScores)
    .filter(([, score]) => score >= 50)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4); // Show top 4 matched topics

  // Get local PNG image based on candidate name
  const getCandidateImage = (candidateName: string) => {
    const name = candidateName.toLowerCase();
    if (name.includes("kast")) return "/candidates/kast.png";
    if (name.includes("jara")) return "/candidates/jara.png";
    return "/candidates/kast.png"; // default
  };

  const candidateImage = getCandidateImage(topCandidate.name);

  const handleShare = () => {
    toast.success("¡Link copiado!", {
      description: "Comparte tu match con tus amigos",
    });
  };

  const handleClose = () => {
    resetApp();
    navigate(`/?userId=${userId}`);
  };

  return (
    <div className="h-screen w-full fixed inset-0 overflow-hidden">
      {/* Background image without overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${topCandidate.avatarUrl})` }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Main content - more space at top */}
        <div className="flex-1 flex flex-col items-center justify-end px-6 pb-24">
          {/* Two column layout */}
          <div className="w-full max-w-2xl grid grid-cols-2 gap-6 mb-6">
            {/* Left column: Percentage and topics */}
            <div className="flex flex-col items-start">
              {/* Match percentage */}
              <div className="mb-3 animate-scale-in">
                <h2 className="text-[80px] md:text-[90px] font-bold text-white leading-none">
                  {overallScore}%
                </h2>
              </div>

              {/* Topic badges */}
              <div className="flex flex-row flex-wrap gap-1.5">
                {matchedTopics.map(([topic, score]) => (
                  <span
                    key={topic}
                    className="px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full whitespace-nowrap"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Right column: Name and party */}
            <div className="flex flex-col items-start justify-start text-white">
              <h3 className="text-xl font-bold mb-1">
                {topCandidate.name}
              </h3>
              <p className="text-sm text-white/90">
                {topCandidate.partyName}
              </p>
            </div>
          </div>

          {/* Share button */}
          <div className="w-full max-w-2xl">
            <Button
              onClick={handleShare}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <Share2 className="h-5 w-5" />
              Share Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevealPage;
