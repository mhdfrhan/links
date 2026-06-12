"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/* ─── Icon helpers (inline SVG, no heroicons dep) ─── */
const IconChat = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconClose = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IconMinus = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="M5 12h14" />
  </svg>
);
const IconExpand = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);
const IconCompress = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
  </svg>
);
const IconSend = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="m22 2-7 20-4-9-9-4 20-7z" />
    <path d="M22 2 11 13" />
  </svg>
);

/* ─── Typing dots ─── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1 px-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 0,
            background: "var(--text-muted)",
            display: "inline-block",
            animation: `chatDotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Single message bubble ─── */
function MessageBubble({
  msg,
  isStreaming,
}: {
  msg: Message;
  isStreaming: boolean;
}) {
  const isUser = msg.role === "user";
  const isEmpty = msg.content === "" && isStreaming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        gap: "8px",
      }}
    >
      {/* Bot avatar dot */}
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 0,
            flexShrink: 0,
            marginTop: 2,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
            fontSize: "10px",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontWeight: 700,
            letterSpacing: "-0.05em",
          }}
        >
          AC
        </div>
      )}

      <div
        style={{
          maxWidth: "78%",
          padding: isEmpty ? "8px 14px" : "9px 14px",
          borderRadius: 0,
          fontSize: "0.8125rem",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          ...(isUser
            ? {
                background: "var(--accent)",
                color: "#fff",
              }
            : {
                background: "color-mix(in srgb, var(--bg-tertiary) 70%, transparent)",
                backdropFilter: "blur(12px)",
                border: "1px solid color-mix(in srgb, var(--border) 40%, transparent)",
                color: "var(--text-primary)",
              }),
        }}
      >
        {isEmpty ? <TypingDots /> : msg.content}
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─── */
export function ChatWidget() {
  const { language } = useLanguage();
  const dict = (dictionaries[language] as any).chat || {
    assistantName: "Asisten Chat",
    welcomeMessage:
      "Hai! 👋 Saya Asisten Chat portfolio Farhan. Mau tanya apa?",
    placeholder: "Tanya tentang Farhan...",
    suggestedQ1: "Apa keahlian Farhan?",
    suggestedQ2: "Ceritakan project-nya",
    suggestedQ3: "Pengalaman kerja",
    errorMessage: "Maaf, terjadi kesalahan. Coba lagi ya.",
    typing: "mengetik...",
    online: "online",
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome message — reinit on lang change
  useEffect(() => {
    setMessages([
      { id: "welcome", role: "assistant", content: dict.welcomeMessage },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen, isMinimized]);

  // Close fullscreen on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) setIsFullscreen(false);
        else if (isOpen) {
          setIsOpen(false);
          setIsMinimized(false);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen, isOpen]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };
      const asstId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: asstId, role: "assistant", content: "" },
      ]);
      setInput("");
      setIsLoading(true);

      try {
        const history = messages
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, lang: language, history }),
        });

        if (response.status === 429) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId
                ? {
                    ...m,
                    content: "Terlalu banyak pesan. Tunggu sebentar ya. ⏳",
                  }
                : m,
            ),
          );
          return;
        }
        if (!response.ok) throw new Error("API Error");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No reader");

        let current = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.replace) {
                current = data.replace;
              } else if (data.text) {
                current += data.text;
              } else if (data.error) {
                current = data.error;
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === asstId ? { ...m, content: current } : m,
                ),
              );
            } catch {
              /* partial chunk, ignore */
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId ? { ...m, content: dict.errorMessage } : m,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, language, dict.errorMessage],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };
  const closeChat = () => {
    setIsOpen(false);
    setIsFullscreen(false);
    setIsMinimized(false);
  };

  /* ── Panel sizing — Framer Motion layout handles smooth transitions ── */
  const getPanelStyle = (): React.CSSProperties => {
    // Fullscreen: cover entire viewport — use explicit coordinates (not inset shorthand)
    // so Framer Motion layout can FLIP-animate from panel position → fullscreen
    if (isFullscreen)
      return {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        borderRadius: 0,
        zIndex: 200,
      };

    // Minimized: pill at very bottom-right corner (same level as FAB)
    if (isMinimized)
      return {
        position: "fixed",
        bottom: 28,
        right: 24,
        top: "auto",
        left: "auto",
        width: "min(260px, calc(100vw - 48px))",
        height: 52,
        borderRadius: 0,
        zIndex: 200,
      };

    // Normal open: float above FAB
    return {
      position: "fixed",
      bottom: 96,
      right: 24,
      top: "auto",
      left: "auto",
      width: "min(380px, calc(100vw - 48px))",
      height: "min(560px, calc(100dvh - 120px))",
      borderRadius: 0,
      zIndex: 200,
    };
  };

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes chatDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .5 }
          40% { transform: translateY(-6px); opacity: 1 }
        }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: var(--border); border-radius: 99px;
        }
        .chat-scroll { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
        .chat-input::placeholder { color: var(--text-muted); }
        .chat-input:focus { outline: none; border-color: var(--accent); }
      `}</style>

      {/* ── FAB ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={openChat}
            className="fixed z-[200] bottom-5 right-5 md:bottom-7 md:right-6 p-3 md:p-[14px] flex items-center justify-center border-none cursor-pointer"
            style={{
              borderRadius: 0,
              background: "var(--accent)",
              color: "#fff",
              boxShadow:
                "0 4px 20px -2px color-mix(in srgb, var(--accent) 50%, transparent)",
            }}
            aria-label="Buka Asisten Chat"
          >
            <IconChat />
            {/* Ping animation */}
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 0,
                background: "var(--accent)",
                opacity: 0.35,
                animation: "ping 2.5s cubic-bezier(0,0,0.2,1) infinite",
              }}
            />
            <style>{`@keyframes ping { 0%{transform:scale(1);opacity:.35} 80%,100%{transform:scale(1.7);opacity:0} }`}</style>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Fullscreen backdrop blur */}
            {isFullscreen && (
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 199,
                  backdropFilter: "blur(2px)",
                }}
              />
            )}

            <motion.div
              key="panel"
              layout
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{
                layout: {
                  type: "spring",
                  stiffness: 300,
                  damping: 28,
                  mass: 0.8,
                },
                opacity: { duration: 0.18 },
                scale: { duration: 0.18 },
                y: { duration: 0.18 },
              }}
              style={{
                ...getPanelStyle(),
                background: "color-mix(in srgb, var(--bg-primary) 85%, transparent)",
                backdropFilter: "blur(8px)",
                border: "1px solid color-mix(in srgb, var(--border) 40%, transparent)",
                boxShadow:
                  "0 25px 50px -12px rgba(0,0,0,0.4), 0 0 40px rgba(237, 93, 49, 0.05)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                // No CSS transition here — layout prop handles everything
              }}
            >
              {/* ── Header ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "transparent",
                  borderBottom: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
                  flexShrink: 0,
                  userSelect: "none",
                }}
              >
                {/* Left: avatar + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 0,
                        background:
                          "color-mix(in srgb, var(--accent) 12%, transparent)",
                        border:
                          "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--accent)",
                      }}
                    >
                      <IconChat />
                    </div>
                    {/* Online dot */}
                    <span
                      style={{
                        position: "absolute",
                        bottom: 1,
                        right: 1,
                        width: 9,
                        height: 9,
                        borderRadius: 0,
                        background: "#22c55e",
                        border: "2px solid var(--bg-tertiary)",
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        lineHeight: 1.3,
                      }}
                    >
                      {dict.assistantName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6875rem",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        color: "#22c55e",
                        letterSpacing: "0.02em",
                      }}
                    >
                      ● {dict.online}
                    </div>
                  </div>
                </div>

                {/* Right: controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {/* Minimize */}
                  <HeaderBtn
                    onClick={() => setIsMinimized((v) => !v)}
                    aria-label={isMinimized ? "Restore" : "Minimize"}
                  >
                    <IconMinus />
                  </HeaderBtn>
                  {/* Fullscreen */}
                  <HeaderBtn
                    onClick={() => {
                      setIsFullscreen((v) => !v);
                      setIsMinimized(false);
                    }}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? <IconCompress /> : <IconExpand />}
                  </HeaderBtn>
                  {/* Close */}
                  <HeaderBtn onClick={closeChat} aria-label="Close" danger>
                    <IconClose />
                  </HeaderBtn>
                </div>
              </div>

              {/* ── Body (hidden when minimized) ── */}
              {!isMinimized && (
                <>
                  {/* Messages */}
                  <div
                    className="chat-scroll"
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "16px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isStreaming={isLoading}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggested chips (first 2 messages only) */}
                  {messages.length <= 2 && !isLoading && (
                    <div
                      style={{
                        padding: "0 14px 10px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {[
                        dict.suggestedQ1,
                        dict.suggestedQ2,
                        dict.suggestedQ3,
                      ].map((q: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleSend(q)}
                          style={{
                            fontSize: "0.6875rem",
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            color: "var(--accent)",
                            background:
                              "color-mix(in srgb, var(--accent) 8%, transparent)",
                            border:
                              "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                            borderRadius: 0,
                            padding: "4px 10px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition:
                              "background 150ms ease, border-color 150ms ease",
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget;
                            el.style.background =
                              "color-mix(in srgb, var(--accent) 15%, transparent)";
                            el.style.borderColor =
                              "color-mix(in srgb, var(--accent) 45%, transparent)";
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget;
                            el.style.background =
                              "color-mix(in srgb, var(--accent) 8%, transparent)";
                            el.style.borderColor =
                              "color-mix(in srgb, var(--accent) 25%, transparent)";
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input row */}
                  <div
                    style={{
                      padding: "10px 14px 12px",
                      borderTop: "1px solid var(--border)",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "color-mix(in srgb, var(--bg-secondary) 60%, transparent)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
                        borderRadius: 0,
                        padding: "6px 6px 6px 16px",
                        transition: "all 200ms ease",
                      }}
                      onFocusCapture={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = "var(--border-hover)";
                      }}
                      onBlurCapture={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = "var(--border)";
                      }}
                    >
                      <input
                        ref={inputRef}
                        className="chat-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={dict.placeholder}
                        disabled={isLoading}
                        style={{
                          flex: 1,
                          background: "transparent",
                          border: "none",
                          fontSize: "0.8125rem",
                          color: "var(--text-primary)",
                          outline: "none",
                          minWidth: 0,
                          opacity: isLoading ? 0.5 : 1,
                        }}
                      />
                      <button
                        onClick={() => handleSend(input)}
                        disabled={!input.trim() || isLoading}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 0,
                          flexShrink: 0,
                          background:
                            !input.trim() || isLoading
                              ? "var(--border)"
                              : "var(--accent)",
                          color: "#fff",
                          border: "none",
                          cursor:
                            !input.trim() || isLoading ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition:
                            "background 200ms ease, transform 100ms ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!(!input.trim() || isLoading))
                            (e.currentTarget as HTMLElement).style.transform =
                              "scale(1.08)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform =
                            "scale(1)";
                        }}
                      >
                        <IconSend />
                      </button>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        marginTop: 6,
                        fontSize: "0.625rem",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        color: "var(--text-muted)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Asisten ini hanya menjawab seputar portfolio Farhan
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Small header button ── */
function HeaderBtn({
  children,
  onClick,
  danger,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  [key: string]: any;
}) {
  return (
    <button
      onClick={onClick}
      {...rest}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        color: "var(--text-muted)",
        cursor: "pointer",
        transition: "background 150ms ease, color 150ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        if (danger) {
          el.style.background = "color-mix(in srgb, #ef4444 12%, transparent)";
          el.style.color = "#ef4444";
        } else {
          el.style.background = "var(--border)";
          el.style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "transparent";
        el.style.color = "var(--text-muted)";
      }}
    >
      {children}
    </button>
  );
}
