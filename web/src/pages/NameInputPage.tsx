import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NameInputPage = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu nombre",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create anonymous user
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError) throw authError;
      
      const userId = authData.user?.id;
      
      if (!userId) throw new Error("No se pudo crear el usuario");

      // Store name in user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: name.trim() }
      });

      if (updateError) throw updateError;

      // Navigate to topics page with user ID
      navigate(`/topics?userId=${userId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al crear tu perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center liquid-background p-6">
      <div className="w-full max-w-md space-y-8 animate-scale-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            ¿Cómo te llamas?
          </h2>
          <p className="text-muted-foreground">
            Necesitamos saber tu nombre para comenzar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg py-6"
            disabled={loading}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full text-lg py-6 shadow-elevated"
            disabled={loading}
          >
            {loading ? "Creando perfil..." : "Continuar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default NameInputPage;
