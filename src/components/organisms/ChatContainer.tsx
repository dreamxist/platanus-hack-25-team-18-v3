import { useState, useRef, useEffect, useCallback } from "react";
import { ChatBubble } from "@/components/molecules/ChatBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

interface ChatContainerProps {
  candidateName: string;
  candidateId: number;
  onReveal: () => void;
  onBack: () => void;
  className?: string;
}

interface ChatbotResponse {
  response?: string;
}

const formatTimestamp = () =>
  new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

const createWelcomeMessage = (): Message => ({
  id: "welcome",
  text: "¡Hola! Parece que tenemos muchas ideas en común. Pregúntame lo que quieras antes de revelar quién soy.",
  isUser: false,
  timestamp: formatTimestamp(),
});

const getMessageId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
};

const buildMessage = (text: string, isUser: boolean): Message => ({
  id: getMessageId(),
  text,
  isUser,
  timestamp: formatTimestamp(),
});

const TypingBubble = () => (
  <div className="flex flex-col gap-1 max-w-[80%] animate-fade-in mr-auto items-start">
    <div className="rounded-2xl px-4 py-3 bg-card border border-border text-muted-foreground rounded-bl-sm shadow-card animate-pulse">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="w-2 h-2 rounded-full bg-gradient-to-r from-primary/70 to-primary animate-bounce"
            style={{ animationDelay: `${index * 0.15}s` }}
          />
        ))}
      </div>
    </div>
    <span className="text-xs text-muted-foreground px-2">Escribiendo…</span>
  </div>
);

export const ChatContainer = ({
  candidateName,
  candidateId,
  onReveal,
  onBack,
  className,
}: ChatContainerProps) => {
  const [messages, setMessages] = useState<Message[]>(() => [
    createWelcomeMessage(),
  ]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationPromiseRef = useRef<Promise<number> | null>(null);
  const isInputLocked = isSending || isCreatingConversation;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  useEffect(() => {
    setMessages([createWelcomeMessage()]);
    setConversationId(null);
    setError(null);
    setIsCreatingConversation(true);
    conversationPromiseRef.current = null;
  }, [candidateId]);

  const ensureConversation = useCallback(async (): Promise<number> => {
    if (conversationId) return conversationId;
    if (conversationPromiseRef.current) return conversationPromiseRef.current;

    const creationPromise = (async () => {
      setIsCreatingConversation(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from("Conversations")
        .insert({ candidate_id: candidateId, status: "active" })
        .select("id")
        .single();

      if (insertError || !data) {
        throw insertError ?? new Error("No se pudo crear la conversación.");
      }

      setConversationId(data.id);
      return data.id;
    })();

    conversationPromiseRef.current = creationPromise;

    try {
      return await creationPromise;
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError("No pudimos iniciar el chat. Intenta nuevamente.");
      throw err;
    } finally {
      conversationPromiseRef.current = null;
      setIsCreatingConversation(false);
    }
  }, [candidateId, conversationId]);

  useEffect(() => {
    void ensureConversation();
  }, [ensureConversation]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isSending) return;

    const text = inputValue.trim();
    setInputValue("");

    const userMessage = buildMessage(text, true);
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    setError(null);

    try {
      const activeConversationId = await ensureConversation();

      const { data, error: functionError } =
        await supabase.functions.invoke<ChatbotResponse>("chatbot", {
          body: {
            prompt: text,
            conversation_id: activeConversationId,
          },
        });

      if (functionError) {
        throw functionError;
      }

      const assistantText = data?.response;

      if (!assistantText) {
        throw new Error("El chatbot no envió una respuesta.");
      }

      const candidateMessage = buildMessage(assistantText, false);
      setMessages((prev) => [...prev, candidateMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(
        "Hubo un problema al conectar con tu match. Revisa tu conexión e intenta nuevamente."
      );
    } finally {
      setIsSending(false);
    }
  }, [ensureConversation, inputValue, isSending]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message.text}
            isUser={message.isUser}
            timestamp={message.timestamp}
          />
        ))}
        {isSending && !isCreatingConversation && !error && <TypingBubble />}
        <div ref={messagesEndRef} />
      </div>

      {/* Action buttons */}
      <div className="px-4 py-4 border-t border-border/50 space-y-3">
        <Button
          onClick={onReveal}
          className="w-full gradient-primary text-primary-foreground font-semibold"
          size="lg"
        >
          Revelar Match
        </Button>
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full"
          size="lg"
        >
          No me convence, seguir deslizando
        </Button>
      </div>

      {/* Input area */}
      <div className="px-4 py-4 border-t border-border/50 bg-card/80 backdrop-blur-lg">
        <div
          className="flex gap-2 relative"
          aria-disabled={isInputLocked}
          aria-busy={isSending}
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Pregúntale lo que quieras..."
            className="flex-1"
            disabled={isInputLocked}
          />
          <Button
            onClick={() => void handleSend()}
            size="icon"
            className="gradient-primary text-primary-foreground"
            disabled={isInputLocked || !inputValue.trim()}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 min-h-[1.5rem]">
          {isCreatingConversation && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Preparando el chat con tu match...
            </p>
          )}
          {!isCreatingConversation && error && (
            <div className="text-xs text-destructive">
              {error}
              {!conversationId && (
                <button
                  type="button"
                  onClick={() => void ensureConversation()}
                  className="ml-2 underline"
                >
                  Reintentar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
