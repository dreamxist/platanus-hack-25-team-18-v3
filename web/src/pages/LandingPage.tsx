import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { clearSession, createNewSession } from "@/services/sessionService";
import { useAuthStore } from "@/stores/useAuthStore";
import { motion } from "framer-motion";
import { spring, fadeInUp, containerVariants, staggerChildren } from "@/config/animations";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const { setTopics } = useAppContext();
  const setUserId = useAuthStore((state) => state.setUserId);

  // Limpiar sesión anterior y crear nueva sesión al cargar landing page
  useEffect(() => {
    const initializeSession = async () => {
      // Primero limpiar cualquier sesión anterior
      await clearSession();

      // Crear nueva sesión anónima
      const userId = await createNewSession();

      if (userId) {
        // Actualizar el store de Zustand
        setUserId(userId);
        console.log("Nueva sesión creada:", userId);
      } else {
        console.error("Error al crear nueva sesión");
      }
    };
    initializeSession();
  }, [setUserId]);

  useEffect(() => {
    // Precargar temas
    const loadTopics = async () => {
      try {
        const { data, error } = await supabase
          .from("Topics")
          .select("id, name, emoji")
          .order("name");

        if (!error && data) {
          setTopics(data);
        }
      } catch (error) {
        console.error("Error precargando temas:", error);
      }
    };

    loadTopics();
  }, [setTopics]);

  const handleStart = () => {
    navigate("/topics");
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background">
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

      {/* Contenido */}
      <motion.div
        className="mb-60 relative z-10 text-center px-6 max-w-3xl mx-auto mt-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge animado */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
          variants={fadeInUp}
        >
          <Sparkles className="w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Elecciones 2025</span>
        </motion.div>

        {/* Título principal */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-6 mt-6 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent"
          variants={fadeInUp}
        >
          Descubre tu candidato ideal
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed"
          variants={fadeInUp}
        >
          Hazle "swipe" a las perspectivas que te importan y encuentra el candidato que mejor se alinea con tus ideas
        </motion.p>

        {/* CTA Button */}
        <motion.div variants={fadeInUp}>
          <Button
            size="lg"
            onClick={handleStart}
            className="text-lg px-8 py-4 h-auto group shadow-lg hover:shadow-xl transition-shadow"
          >
            Descubrir
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Estadísticas o features */}
        <motion.div
          className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          variants={containerVariants}
          custom={staggerChildren.slow}
        >
          <motion.div variants={fadeInUp} className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">+100</div>
            <div className="text-sm text-muted-foreground">Perspectivas por candidato</div>
          </motion.div>
          <motion.div variants={fadeInUp} className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Imparcial</div>
          </motion.div>
          <motion.div variants={fadeInUp} className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">1 min</div>
            <div className="text-sm text-muted-foreground">Para completar</div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
