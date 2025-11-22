import { VotingResults } from "@/components/organisms/VotingResults";
import NavigationHeader from "@/components/organisms/NavigationHeader";

const VotingResultsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-red-50">
      <NavigationHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <VotingResults />
      </main>
    </div>
  );
};

export default VotingResultsPage;

