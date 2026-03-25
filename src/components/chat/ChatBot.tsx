"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Minus, Maximize2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/auth.store";
import Image from "next/image";

type Message = {
  role: "user" | "assistant";
  content: string;
  id: string;
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi there! I'm Gami, your AI study buddy. Do you have any questions about your lessons today?",
      id: "welcome",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim(), id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiFetch<any>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMsg.content,
          // Context could be added here if we were on a specific lesson page
        }),
      });

      const botMsg: Message = {
        role: "assistant",
        content: response?.data?.reply ?? response?.reply ?? "I'm sorry, I couldn't process that. Try again?",
        id: (Date.now() + 1).toString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops! My connection is a bit fuzzy. Can you try again later?", id: "error" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`glass-card mb-4 flex flex-col overflow-hidden shadow-2xl transition-all ${
              isMinimized ? "h-14 w-64" : "h-[500px] w-[350px]"
            }`}
            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-white/5 p-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8 overflow-hidden rounded-full border border-cyan-400/30">
                  <Image src="/gami.jpeg" alt="Gami" fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Gami</p>
                  <div className="flex items-center gap-1.5 ">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                    <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Online</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
                  {isMinimized ? <Maximize2 size={14} className="text-white/60" /> : <Minus size={14} className="text-white/60" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
                  <X size={14} className="text-white/60" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: m.role === "user" ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                          m.role === "user"
                            ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/20"
                            : "bg-white/5 text-white/90 border border-white/10"
                        }`}
                      >
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 rounded-2xl p-4 flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/10 bg-black/20">
                  <div className="relative flex items-center">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Ask Gami anything..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="absolute right-1.5 p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 text-black transition-all"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={`group relative h-16 w-16 overflow-hidden rounded-full border-2 border-cyan-400/50 p-0.5 shadow-2xl transition-all hover:border-cyan-400 ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <Image src="/gami.jpeg" alt="Gami" fill className="object-cover transition-transform group-hover:scale-110" />
        </div>
        <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>
    </div>
  );
}
