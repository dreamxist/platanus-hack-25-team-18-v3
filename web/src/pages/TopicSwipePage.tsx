import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { SwipeCard } from "@/components/molecules/SwipeCard";
import { ChevronDown } from "lucide-react";

const TopicSwipePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const topicId = searchParams.get("topicId");
  const candidateId = searchParams.get("candidateId");

  const { topics, ideas, answerIdea } = useAppContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isSwipingDown, setIsSwipingDown] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isTopZoneRef = useRef(false);

  // Encontrar el nombre del topic por ID
  const topic = topics.find(t => t.id === Number(topicId));
  const topicName = topic?.name;

  // Filtrar ideas por tema (por topicId)
  const topicIdeas = topicId ? ideas.filter(idea => idea.topicId === Number(topicId)) : [];

  const currentIdea = topicIdeas[currentIndex];

  useEffect(() => {
    if (topicIdeas.length > 0 && !currentIdea) {
      // Se acabaron las ideas de este tema
      // En modo post-match (cuando viene de /match), volver a match
      // De lo contrario, continuar con el flujo normal
      if (candidateId) {
        navigate(`/match?userId=${userId}`);
      }
    }
  }, [currentIdea, topicIdeas.length, navigate, userId, candidateId]);

  // Si no hay topics cargados o no hay ideas para este tema
  if (!topicName || topicIdeas.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-white via-blue-50 to-red-50">
        <p className="text-lg text-muted-foreground mb-4">
          {!topicName ? "Cargando tema..." : "No hay preguntas para este tema"}
        </p>
        {topicName && topicIdeas.length === 0 && (
          <button
            onClick={() => navigate(`/match?userId=${userId}`)}
            className="px-4 py-2 rounded-lg bg-card border border-border hover:shadow-elevated transition-smooth"
          >
            Volver
          </button>
        )}
      </div>
    );
  }

  if (!currentIdea) {
    return null;
  }

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    startYRef.current = clientY;

    // Detectar si el toque/click empieza en la zona superior (primeros 100px)
    isTopZoneRef.current = clientY < 100;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const diffX = clientX - startXRef.current;
    const diffY = clientY - startYRef.current;

    // Si inició en la zona superior, permitir swipe down
    if (isTopZoneRef.current && diffY > 20) {
      setDragY(diffY);
      setIsSwipingDown(diffY > 50);
      setDragX(0);
      setSwipeDirection(null);
    } else {
      // Swipe horizontal normal
      setDragX(diffX);
      setDragY(0);
      setIsSwipingDown(false);

      // Update swipe direction indicator
      if (Math.abs(diffX) > 50) {
        setSwipeDirection(diffX > 0 ? "right" : "left");
      } else {
        setSwipeDirection(null);
      }
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;

    const threshold = 100;

    // Swipe down para salir
    if (isSwipingDown && dragY > 150) {
      navigate(`/match?userId=${userId}`);
      return;
    }

    // Swipe horizontal para responder
    if (Math.abs(dragX) > threshold) {
      if (dragX > 0) {
        answerIdea(userId, "agree");
      } else {
        answerIdea(userId, "disagree");
      }
      setCurrentIndex(prev => prev + 1);
    }

    // Reset
    setIsDragging(false);
    setDragX(0);
    setDragY(0);
    setSwipeDirection(null);
    setIsSwipingDown(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd();
    }
  };

  return (
    <div
      className="h-screen w-full fixed inset-0 overflow-hidden bg-gradient-to-br from-white via-blue-50 to-red-50 flex flex-col"
      style={{
        transform: `translateY(${Math.max(0, dragY)}px)`,
        transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Indicador de swipe down */}
      <div className={`w-full flex justify-center pt-2 pb-1 transition-opacity duration-300 ${isSwipingDown ? 'opacity-100' : 'opacity-40'}`}>
        <div className="flex flex-col items-center gap-1">
          <div className="swipe-down-handle"></div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isSwipingDown ? 'scale-125' : ''}`} />
        </div>
      </div>

      {/* Header con nombre del tema */}
      <div className="flex-shrink-0 text-center py-4 px-6">
        <h3 className="text-lg font-semibold text-foreground">
          {topicName || "Tema"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} de {topicIdeas.length}
        </p>
        {candidateId && (
          <p className="text-xs text-muted-foreground mt-1">
            Desliza hacia abajo para volver
          </p>
        )}
      </div>

      {/* Card con swipe */}
      <div
        className="flex-1 flex items-center justify-center px-6 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <SwipeCard
          idea={currentIdea}
          swipeDirection={swipeDirection}
        />
      </div>
    </div>
  );
};

export default TopicSwipePage;
