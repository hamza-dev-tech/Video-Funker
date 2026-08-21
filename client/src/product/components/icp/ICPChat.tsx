import { useState, useRef, useEffect } from "react";
import { Button } from "@product/components/ui/button";
import { cn } from "@product/lib/utils";
import { Send, Bot, User, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { sendChatMessage, ChatMessage as APIChatMessage } from "@product/lib/api";
import { useToast } from "@product/hooks/use-toast";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  progress?: number;
}

interface ICPChatProps {
  campaignId?: string;
  onProgressUpdate?: (progress: number) => void;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hello! I'm your ICP Builder AI. I'll help you create a comprehensive Ideal Customer Profile through a series of questions. Let's start — tell me about your business and what product or service you offer."
};

export function ICPChat({ campaignId, onProgressUpdate }: ICPChatProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [conversationHistory, setConversationHistory] = useState<APIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    setMessages([WELCOME_MESSAGE]);
    setConversationHistory([]);
    setError(null);
  }, [campaignId]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isTyping) return;

    if (!campaignId) {
      toast({ title: "No Campaign Selected", description: "Please select a campaign first.", variant: "destructive" });
      return;
    }

    const userMessage: Message = { id: Date.now().toString(), role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError(null);

    const updatedHistory: APIChatMessage[] = [...conversationHistory, { role: "user", content }];

    try {
      const response = await sendChatMessage(campaignId, content, conversationHistory);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(), role: "assistant",
        content: response.message, progress: response.progress?.percentComplete
      };
      setMessages(prev => [...prev, assistantMessage]);
      setConversationHistory([...updatedHistory, { role: "assistant", content: response.message }]);
      if (response.progress?.percentComplete && onProgressUpdate) {
        onProgressUpdate(response.progress.percentComplete);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get AI response");
      toast({ title: "Connection Error", description: "Could not connect to backend.", variant: "destructive" });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {error && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Backend not connected. Start the server with: <code className="px-1 bg-destructive/20 rounded">cd backend && npm run dev</code></span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex gap-3 animate-slide-up", message.role === "user" ? "flex-row-reverse" : "")}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              message.role === "assistant" ? "bg-gradient-to-br from-primary to-accent" : "bg-secondary")}>
              {message.role === "assistant" ? <Bot className="w-5 h-5 text-primary-foreground" /> : <User className="w-5 h-5 text-foreground" />}
            </div>
            <div className={cn("max-w-[70%] rounded-2xl px-4 py-3",
              message.role === "assistant" ? "bg-card border border-border" : "bg-primary text-primary-foreground")}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.progress !== undefined && message.progress > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${message.progress}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{message.progress}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              placeholder={campaignId ? "Type your answer..." : "Select a campaign to start..."}
              disabled={!campaignId}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50" />
            <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <Button size="icon" variant="glow" onClick={() => handleSend(input)} disabled={!input.trim() || isTyping || !campaignId}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
