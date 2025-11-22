import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { getTopCandidate, getCandidateScore, getTopicScores } from "@/data/mockData";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Share2, X, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { spring } from "@/config/animations";
import { toPng } from "html-to-image";

const RevealPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const { answers, resetApp, candidates, ideas } = useAppContext();
  const shareRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const topCandidate = getTopCandidate(answers, candidates);

  if (!topCandidate) {
    navigate(`/?userId=${userId}`);
    return null;
  }

  const overallScore = getCandidateScore(topCandidate.id, answers);
  const topicScores = getTopicScores(topCandidate.id, answers, ideas);

  // Separate topics into matches and differences
  const matches = Object.entries(topicScores)
    .filter(([, score]) => score >= 50)
    .sort(([, a], [, b]) => b - a);

  const differences = Object.entries(topicScores)
    .filter(([, score]) => score < 50)
    .sort(([, a], [, b]) => a - b); // Sort differences ascending (lowest score first)

  // Derived for hero section
  const matchedTopics = matches.slice(0, 4);

  // Get local PNG image based on candidate name
  const getCandidateImage = (candidateName: string) => {
    const name = candidateName.toLowerCase();
    if (name.includes("kast")) return "/candidates/kast.png";
    if (name.includes("jara")) return "/candidates/jara.png";
    return "/candidates/kast.png"; // default
  };

  const candidateImage = getCandidateImage(topCandidate.name);

  // Helper function to convert image URL to base64 using fetch (more reliable on mobile)
  const getImageAsBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`Error loading image ${url}:`, error);
      throw error;
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      toast.info("Preparando imagen...", { duration: 2000 });
      
      // Pre-load images as base64
      console.log('Loading candidate image:', candidateImage);
      const candidateImageBase64 = await getImageAsBase64(candidateImage);
      console.log('Candidate image loaded');
      
      console.log('Loading chile image');
      const chileImageBase64 = await getImageAsBase64('/screen/chile.png');
      console.log('Chile image loaded');
      
      // Update the images in the share ref
      if (shareRef.current) {
        const candidateImgElement = shareRef.current.querySelector('.candidate-share-image') as HTMLImageElement;
        const chileImgElement = shareRef.current.querySelector('.chile-share-image') as HTMLImageElement;
        
        console.log('Found elements:', { 
          candidate: !!candidateImgElement, 
          chile: !!chileImgElement 
        });
        
        if (candidateImgElement) candidateImgElement.src = candidateImageBase64;
        if (chileImgElement) chileImgElement.src = chileImageBase64;
      }
      
      // Wait for images to be updated in DOM and fully loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (shareRef.current) {
        toast.info("Generando imagen...", { duration: 2000 });
        
        console.log('Starting toPng conversion');
        const dataUrl = await toPng(shareRef.current, {
          cacheBust: true,
          pixelRatio: 2, // Higher quality
          backgroundColor: '#ffffff', // Ensure no transparency
          skipFonts: true, // Skip font embedding for better compatibility
          style: {
            opacity: '1',
            visibility: 'visible',
            zIndex: '9999', // Ensure it's on top in the capture
          }
        });
        
        console.log('Image generated successfully');
        
        const link = document.createElement('a');
        link.download = `match-${topCandidate.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();
        
        toast.success("¡Imagen descargada!", {
          description: "Lista para compartir en tus redes",
        });
      }
    } catch (err) {
      console.error('Share error:', err);
      toast.error("Error al generar la imagen", {
        description: err instanceof Error ? err.message : 'Error desconocido'
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    resetApp();
    navigate(`/?userId=${userId}`);
  };

  return (
    <div className="min-h-[100dvh] w-full relative bg-background">
      {/* Shareable Component - Rendered but invisible to user */}
      <div 
        ref={shareRef}
        className="fixed top-0 left-0 w-[1080px] h-[1920px] bg-background overflow-hidden flex flex-col z-[-50]"
        style={{ 
          // Keep it in the DOM and layout, but invisible and behind everything
          visibility: isSharing ? 'visible' : 'hidden',
          opacity: 0, 
          pointerEvents: 'none',
        }}
      >
         {/* Background Elements for Share Image */}
        <div className="absolute inset-0 z-0">
          {/* Chile background image */}
          <img 
            src="/screen/chile.png"
            alt=""
            className="chile-share-image absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background/90" />
        </div>

        {/* Content for Share Image - Vertical layout */}
        <div className="relative z-10 h-full flex flex-col pt-48">
          {/* Top section - Candidate Image */}
          <div className="h-[55%] flex items-center justify-center relative">
            <img 
              src={candidateImage}
              alt={topCandidate.name}
              className="candidate-share-image h-full w-auto object-contain"
              style={{ maxHeight: '100%', maxWidth: '100%' }}
            />
          </div>

          {/* Bottom section - Content */}
          <div className="h-[45%] flex flex-col items-center justify-center px-16 py-8">
            {/* Match percentage */}
            <div className="mb-8">
              <h2 className="text-[200px] font-bold text-foreground leading-none tracking-tighter text-center">
                {overallScore}%
              </h2>
            </div>

            {/* Name and party */}
            <div className="text-center mb-10">
              <h3 className="text-6xl font-bold mb-3 text-foreground">
                {topCandidate.name}
              </h3>
              <p className="text-4xl text-muted-foreground">
                {topCandidate.partyName}
              </p>
            </div>

            {/* Topic badges */}
            <div className="flex flex-row flex-wrap justify-center gap-4 mb-10 max-w-[900px]">
              {matchedTopics.slice(0, 3).map(([topic]) => (
                <span
                  key={topic}
                  className="px-6 py-3 bg-amber-500 text-white text-2xl font-bold rounded-full whitespace-nowrap"
                >
                  {topic}
                </span>
              ))}
            </div>
            
            {/* Branding/Footer */}
            <div className="mt-auto">
              <p className="text-3xl font-medium text-muted-foreground/70 text-center">
                Descubre tu candidato en MiCandida.top
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Background Elements (Visible App) */}
      <div className="fixed inset-0 z-0">
        {/* Fondo con imagen de chile */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/screen/chile.png')",
          }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ ...spring.smooth, duration: 1.2 }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />

        {/* Candidate image as watermark */}
        <div
          className="absolute inset-0 bg-center bg-no-repeat opacity-100"
          style={{
            backgroundImage: `url(${candidateImage})`,
            backgroundSize: '100%'
          }}
        />

        {/* Bottom gradient for text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-background from-45% via-background to-transparent" />
      </div>

      {/* Scrollable Content */}
      <div className="relative z-10 flex flex-col w-full">
        {/* Hero Section (Full Height) */}
        <div className="h-[100dvh] w-full flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-end px-6 pb-24">
            {/* Two column layout */}
            <div className="w-full max-w-2xl grid grid-cols-2 gap-6 mb-6">
              {/* Left column: Percentage and topics */}
              <div className="flex flex-col items-start">
                {/* Match percentage */}
                <div className="mb-3 animate-scale-in">
                  <h2 className="text-[80px] md:text-[90px] font-bold text-foreground leading-none">
                    {overallScore}%
                  </h2>
                </div>

                {/* Topic badges - Show only top 3 matches here */}
                <div className="flex flex-row flex-wrap gap-1.5">
                  {matchedTopics.slice(0, 3).map(([topic, score]) => {
                    let bgColor = "bg-red-500";
                    if (score >= 70) bgColor = "bg-emerald-500";
                    else if (score >= 50) bgColor = "bg-amber-500";
                    
                    return (
                      <span
                        key={topic}
                        className={`px-3 py-1 ${bgColor} text-white text-xs font-semibold rounded-full whitespace-nowrap`}
                      >
                        {topic}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Right column: Name and party */}
              <div className="flex flex-col items-start justify-start text-foreground mt-5">
                <h3 className="text-xl font-bold mb-1">
                  {topCandidate.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {topCandidate.partyName}
                </p>
              </div>
            </div>

            {/* Share button */}
            <div className="w-full max-w-2xl mb-8">
              <Button
                onClick={handleShare}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg"
              >
                <Share2 className="h-5 w-5" />
                Share Now
              </Button>
            </div>
            
            {/* Scroll indicator */}
            <div className="animate-bounce text-muted-foreground/70 pb-4">
              <span className="text-sm font-medium">Desliza para ver detalles</span>
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="w-full bg-background/95 backdrop-blur-sm rounded-t-[32px] -mt-6 pt-10 pb-20 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="max-w-2xl mx-auto space-y-10">
            
            {/* Matches Section */}
            {matches.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">
                  Temas donde más coinciden
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {matches.map(([topic, score]) => (
                    <div key={topic} className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 flex flex-col justify-between h-32">
                      <span className="text-sm font-medium text-foreground/80 leading-tight">
                        {topic}
                      </span>
                      <span className="text-3xl font-bold text-emerald-500">
                        {Math.round(score)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Differences Section */}
            {differences.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">
                  Temas con diferencias
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {differences.map(([topic, score]) => (
                    <div key={topic} className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 flex flex-col justify-between h-32">
                      <span className="text-sm font-medium text-foreground/80 leading-tight">
                        {topic}
                      </span>
                      <span className="text-3xl font-bold text-amber-500">
                        {Math.round(score)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Action */}
            <div className="pt-8 pb-10">
               <Button
                variant="outline"
                onClick={handleClose}
                className="w-full h-14 text-lg font-medium rounded-xl border-2"
              >
                Volver al inicio
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RevealPage;
