import { Candidate, UserAnswer, Idea, getCandidateScore, getTopicScores } from "@/data/mockData";
import { ScoreMeter } from "@/components/atoms/ScoreMeter";
import { TopicTag } from "@/components/atoms/TopicTag";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsPanelProps {
  candidate: Candidate;
  answers: UserAnswer[];
  ideas: Idea[];
  className?: string;
  onShare?: () => void;
}

export const StatsPanel = ({ candidate, answers, ideas, className, onShare }: StatsPanelProps) => {
  const overallScore = getCandidateScore(candidate.id, answers);
  const topicScores = getTopicScores(candidate.id, answers, ideas);

  const sortedTopics = Object.entries(topicScores).sort(([, a], [, b]) => b - a);
  const topMatches = sortedTopics.slice(0, 3);
  const disagreements = sortedTopics.filter(([, score]) => score < 50);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall score with name and share */}
      <Card className="p-8 text-center gradient-card shadow-elevated">
        {/* Candidate info */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            ¡Es un Match!
          </p>
          <h2 className="text-3xl font-bold text-foreground mb-1">
            {candidate.name}
          </h2>
          <p className="text-base text-muted-foreground">
            {candidate.partyName}
          </p>
        </div>

        <h3 className="text-lg font-semibold text-muted-foreground mb-4">
          Tu nivel de coincidencia
        </h3>

        <p className="mt-4 text-sm text-muted-foreground">
          Coincides en <span className="font-semibold text-primary">{overallScore}%</span> de las ideas
        </p>

        {/* Share button */}
        {onShare && (
          <div className="mt-6">
            <Button
              onClick={onShare}
              variant="outline"
              size="lg"
              className="gap-2 w-full sm:w-auto"
            >
              <Share2 className="h-4 w-4" />
              Compartir mi match
            </Button>
          </div>
        )}
      </Card>

      {/* Top matches */}
      <Card className="p-6 gradient-card shadow-card">
        <h3 className="text-lg font-semibold mb-4">Temas donde más coinciden</h3>
        <div className="space-y-3">
          {topMatches.map(([topic, score]) => (
            <div key={topic} className="flex items-center justify-between">
              <TopicTag topic={topic} />
              <span className="text-lg font-bold text-success">{score}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Disagreements */}
      {disagreements.length > 0 && (
        <Card className="p-6 gradient-card shadow-card">
          <h3 className="text-lg font-semibold mb-4">Temas con diferencias</h3>
          <div className="space-y-3">
            {disagreements.map(([topic, score]) => (
              <div key={topic} className="flex items-center justify-between">
                <TopicTag topic={topic} className="bg-destructive/10 text-destructive border-destructive/20" />
                <span className="text-lg font-bold text-destructive">{score}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mock stats */}
      <Card className="p-6 gradient-card shadow-card">
        <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">1,258</span> personas han hecho match con este candidato
          </p>
          <p>
            <span className="font-semibold text-foreground">78%</span> de afinidad promedio
          </p>
        </div>
      </Card>
    </div>
  );
};
