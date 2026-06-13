import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Brain, 
  HelpCircle,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { useStore, api } from "../store/useStore";

export default function AiChat() {
  const user = useStore((state) => state.user);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "assistant",
      text: `Hello ${user?.name || "Marketer"}! I'm XenoAI, your Shopper Engagement assistant. I analyze store telemetry, segment performance, and copy conversions in real-time.\n\nWhat campaign planning can I assist you with today?`
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      id: `${Date.now()}_user`,
      sender: "user",
      text
    };
    
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsLoading(true);

    try {
      // Clean history for API context mapping
      const historyPayload = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await api.post("/ai/chat", {
        message: text,
        history: historyPayload
      });

      // Add assistant response
      const assistantMsg = {
        id: `${Date.now()}_assistant`,
        sender: "assistant",
        text: res.data.reply
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: `${Date.now()}_error`,
        sender: "assistant",
        text: "My neural connection timed out. Please check if the Express CRM server is running and try again."
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: "Who should I target?", query: "Who should I target?" },
    { label: "Generate a winback campaign", query: "Generate a retention campaign winback WhatsApp copy" },
    { label: "Why did my campaign fail?", query: "Why did this campaign fail?" },
    { label: "Suggest best audience segment", query: "Suggest best-performing audience segment based on store data" }
  ];

  return (
    <div className="p-8 flex-1 overflow-hidden h-screen flex gap-8 max-w-7xl mx-auto w-full">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full glass-panel rounded-2xl border-white/5 overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 bg-[#0d0d11]/80 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-200">XenoAI Marketer Assistant</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-dot-green animate-pulse" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">CMO Brain Mode Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-black/20">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
              >
                <div
                  className={`max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    isUser
                      ? "bg-violet-600 border border-violet-500/30 text-white rounded-tr-none shadow-md shadow-violet-500/10"
                      : "bg-[#161424] border border-white/5 text-gray-200 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[75%] p-4 rounded-2xl rounded-tl-none bg-[#161424] border border-white/5 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Queries Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0d0d11]/40">
          <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest block mb-2">
            ⚡ Quick suggestions
          </span>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.query)}
                className="text-[11px] px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/20 text-gray-400 hover:text-violet-300 hover:bg-violet-950/10 transition-all font-medium"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Prompt Entry Input */}
          <div className="flex gap-3 mt-4">
            <input
              type="text"
              placeholder="Ask XenoAI: 'Generate a retention campaign'..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-lg shadow-violet-500/10 transition-all disabled:opacity-50 shrink-0"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Side panel for AI assistant stats */}
      <div className="w-80 h-fit glass-panel p-6 rounded-2xl border-white/5 bg-gradient-to-b from-black/40 to-violet-950/5 flex flex-col gap-6 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-gray-100 tracking-tight flex items-center gap-2 mb-3">
            <Sparkles className="w-4.5 h-4.5 text-violet-400" />
            Agent Diagnostics
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            The XenoAI Marketer Assistant has native query capabilities. It queries the live shopper databases to calculate segments and suggest copy tailored specifically to your active products.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-gray-200 block">Copy optimization</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Tone adaptation leverages behavioral traits for better conversion lift.</span>
            </div>
          </div>
          <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-gray-200 block">Audience identification</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Semantic logic maps requests dynamically into MongoDB database queries.</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
