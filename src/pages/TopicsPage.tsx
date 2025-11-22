import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, spring, createStaggerContainer } from "@/config/animations";

interface Topic {
  id: number;
  name: string;
  emoji: string;
}

const TopicsPage = () => {
  const { topics: preloadedTopics, setTopics: setContextTopics, resetApp } = useAppContext();
  const [topics, setTopics] = useState<Topic[]>(preloadedTopics);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [loading, setLoading] = useState(preloadedTopics.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Siempre recargar para asegurar que tenemos los emojis
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from("Topics")
        .select("id, name, emoji")
        .order("name");

      if (error) throw error;
      setTopics(data || []);
      setContextTopics(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los temas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topicId: number) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else if (prev.length < 5) {
        return [...prev, topicId];
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (selectedTopics.length === 0) {
      toast({
        title: "Selecciona al menos un tema",
        description: "Debes elegir entre 1 y 5 temas",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Verificar si ya existe una sesión
      const { data: { session } } = await supabase.auth.getSession();

      let userId: string;

      if (session?.user) {
        // Ya existe un usuario en sesión, usar ese
        userId = session.user.id;
      } else {
        // No hay sesión, crear usuario anónimo
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

        if (authError) throw authError;

        if (!authData.user?.id) throw new Error("No se pudo crear el usuario");

        userId = authData.user.id;
      }

      // Guardar temas seleccionados
      const userTopics = selectedTopics.map(topicId => ({
        user_id: userId,
        topic_id: topicId,
      }));

      const { error } = await supabase
        .from("UserTopics")
        .insert(userTopics);

      if (error) throw error;

      // Iniciar animación de transición
      setIsTransitioning(true);

      // Navegar después de la animación
      setTimeout(() => {
        navigate(`/swipe?userId=${userId}`);
      }, 600);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar tus preferencias",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-subtle">
        <p className="text-lg text-muted-foreground">Cargando temas...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-white via-blue-50 to-red-50 p-6 ${isTransitioning ? 'animate-fade-out-up' : ''}`}>
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.smooth}
      >
        {/* Header con título e instrucciones */}
        <motion.div
          className="text-center mb-8 pt-8"
          variants={createStaggerContainer(0.1, 0.2)}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={fadeInUp}
            className="text-3xl md:text-5xl font-bold text-foreground mb-4"
          >
            Elige tus temas de interés
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Selecciona entre 1 y 5 temas que más te importan. Te mostraremos candidatos que se alinean con tus preferencias.
          </motion.p>
          <motion.p
            variants={fadeInUp}
            className="text-sm text-muted-foreground/80 mt-2"
          >
            {selectedTopics.length}/5 temas seleccionados
          </motion.p>
        </motion.div>

        {/* Grid de temas */}
        <motion.div
          className="pb-32"
          variants={createStaggerContainer(0.08, 0.4)}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {topics.map((topic, index) => (
              <motion.div
                key={topic.id}
                variants={fadeInUp}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring.smooth}
                className={`
                  relative aspect-square rounded-2xl shadow-card hover:shadow-elevated
                  cursor-pointer flex flex-col items-center justify-center gap-3 p-4
                  glass-effect
                  ${selectedTopics.includes(topic.id) ? 'border-2 border-primary' : 'border border-border/50'}
                `}
                onClick={() => toggleTopic(topic.id)}
              >
                <AnimatePresence>
                  {selectedTopics.includes(topic.id) && (
                    <motion.div
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={spring.bouncy}
                    >
                      <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div
                  className="text-5xl md:text-6xl"
                  animate={selectedTopics.includes(topic.id) ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {topic.emoji || '📌'}
                </motion.div>
                <p className="font-semibold text-foreground text-sm md:text-base text-center">
                  {topic.name}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Botón flotante */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.smooth, delay: 0.6 }}
      >
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full text-lg py-6 shadow-elevated"
            disabled={submitting || selectedTopics.length === 0}
          >
            {submitting ? "Guardando..." : "Comenzar a conocer candidatos"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default TopicsPage;
