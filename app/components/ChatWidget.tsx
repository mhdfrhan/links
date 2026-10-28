"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

// Simple markdown-to-HTML renderer for chat messages
function renderMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```[\s\S]*?```/g, (m) => {
      const code = m.replace(/```(\w+)?\n?/, "").replace(/```$/, "");
      return `<pre style="background:var(--bg-tertiary);padding:8px 12px;overflow-x:auto;font-size:0.75rem;border-radius:8px;margin:6px 0;border:1px solid var(--border)"><code>${code.replace(/</g, "&lt;")}</code></pre>`;
    })
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Headers h3
    .replace(/^###\s+(.+)$/gm, "<h3 style='font-size:0.875rem;font-weight:600;margin:8px 0 4px;'>$1</h3>")
    // Headers h2
    .replace(/^##\s+(.+)$/gm, "<h2 style='font-size:0.9375rem;font-weight:700;margin:10px 0 4px;'>$1</h2>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr style='border:none;border-top:1px solid var(--border);margin:8px 0;'/>")
    // Unordered list items
    .replace(/^[\-\*]\s+(.+)$/gm, "<li style='margin:2px 0;padding-left:4px;'>$1</li>")
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style='padding-left:16px;margin:4px 0;list-style:disc;'>${m}</ul>`)
    // Newlines to <br> (only for non-block elements)
    .replace(/(?<!>)\n(?!<)/g, "<br/>");
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/* ─── Icon helpers ─── */
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
    <div className="flex items-center gap-1.5 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "inline-block",
            animation: `chatDotBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
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
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        gap: "8px",
      }}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "8px",
            flexShrink: 0,
            marginTop: 2,
            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
            fontSize: "10px",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontWeight: 600,
          }}
        >
          AC
        </div>
      )}

      <div
        style={{
          maxWidth: "82%",
          padding: isEmpty ? "8px 14px" : "10px 14px",
          borderRadius: isUser ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
          fontSize: "0.8125rem",
          lineHeight: 1.6,
          wordBreak: "break-word",
          overflowWrap: "break-word",
          boxShadow: isUser ? "0 2px 8px -2px rgba(108,158,245,0.25)" : "none",
          ...(isUser
            ? {
                background: "var(--accent)",
                color: "#ffffff",
                whiteSpace: "pre-wrap",
              }
            : {
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }),
        }}
      >
        {isEmpty ? (
          <TypingDots />
        ) : isUser ? (
          msg.content
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            style={{ overflow: "hidden" }}
          />
        )}
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
      if (window.innerWidth > 768) {
        const t = setTimeout(() => inputRef.current?.focus(), 150);
        return () => clearTimeout(t);
      }
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
              /* partial chunk */
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

  const getPanelStyle = (): React.CSSProperties => {
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

    if (isMinimized)
      return {
        position: "fixed",
        bottom: 24,
        right: 20,
        top: "auto",
        left: "auto",
        width: "min(280px, calc(100vw - 32px))",
        height: 52,
        borderRadius: "14px",
        zIndex: 200,
      };

    return {
      position: "fixed",
      bottom: 86,
      right: 20,
      top: "auto",
      left: "auto",
      width: "min(390px, calc(100vw - 32px))",
      height: "min(580px, calc(100dvh - 110px))",
      borderRadius: "16px",
      zIndex: 200,
    };
  };

  return (
    <>
      <style>{`
        @keyframes chatDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .45 }
          40% { transform: translateY(-5px); opacity: 1 }
        }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: var(--border); border-radius: 99px;
        }
        .chat-scroll { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
        .chat-input::placeholder { color: var(--text-muted); }
      `}</style>

      {/* ── FAB ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 25 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={openChat}
            className="fixed z-[200] bottom-5 right-5 md:bottom-7 md:right-6 p-3.5 flex items-center justify-center border border-[var(--border)] cursor-pointer"
            style={{
              borderRadius: "14px",
              background: "var(--accent)",
              color: "#fff",
              boxShadow: "0 4px 16px -2px color-mix(in srgb, var(--accent) 40%, transparent)",
            }}
            aria-label="Buka Asisten Chat"
          >
            <IconChat />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <>
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
                  backdropFilter: "blur(4px)",
                  background: "rgba(0,0,0,0.4)",
                }}
              />
            )}

            <motion.div
              key="panel"
              layout
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{
                layout: {
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                  mass: 0.8,
                },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
                y: { duration: 0.2 },
              }}
              style={{
                ...getPanelStyle(),
                background: "color-mix(in srgb, var(--bg-secondary) 94%, transparent)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid var(--border)",
                boxShadow: "0 16px 40px -10px rgba(0,0,0,0.3)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* ── Header ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "var(--bg-primary)",
                  borderBottom: "1px solid var(--border)",
                  flexShrink: 0,
                  userSelect: "none",
                }}
              >
                {/* Left: avatar + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "10px",
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
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
                        bottom: -1,
                        right: -1,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--green)",
                        border: "2px solid var(--bg-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 500,
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
                        color: "var(--green)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      ● {dict.online}
                    </div>
                  </div>
                </div>

                {/* Right: controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <HeaderBtn
                    onClick={() => setIsMinimized((v) => !v)}
                    aria-label={isMinimized ? "Restore" : "Minimize"}
                  >
                    <IconMinus />
                  </HeaderBtn>
                  <HeaderBtn
                    onClick={() => {
                      setIsFullscreen((v) => !v);
                      setIsMinimized(false);
                    }}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? <IconCompress /> : <IconExpand />}
                  </HeaderBtn>
                  <HeaderBtn onClick={closeChat} aria-label="Close" danger>
                    <IconClose />
                  </HeaderBtn>
                </div>
              </div>

              {/* ── Body ── */}
              {!isMinimized && (
                <>
                  {/* Messages */}
                  <div
                    className="chat-scroll"
                    data-lenis-prevent
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "16px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
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

                  {/* Suggested chips */}
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
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSend(q)}
                          style={{
                            fontSize: "0.6875rem",
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            color: "var(--text-secondary)",
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border)",
                            borderRadius: "999px",
                            padding: "4px 10px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition: "border-color 150ms ease, color 150ms ease",
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget;
                            el.style.borderColor = "var(--border-hover)";
                            el.style.color = "var(--text-primary)";
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget;
                            el.style.borderColor = "var(--border)";
                            el.style.color = "var(--text-secondary)";
                          }}
                        >
                          {q}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Input row */}
                  <div
                    style={{
                      padding: "10px 14px 12px",
                      borderTop: "1px solid var(--border)",
                      flexShrink: 0,
                      background: "var(--bg-primary)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        padding: "6px 6px 6px 14px",
                        transition: "border-color 150ms ease",
                      }}
                      onFocusCapture={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.borderColor = "var(--accent)";
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
                          opacity: isLoading ? 0.6 : 1,
                        }}
                      />
                      <motion.button
                        whileHover={{ scale: !input.trim() || isLoading ? 1 : 1.05 }}
                        whileTap={{ scale: !input.trim() || isLoading ? 1 : 0.95 }}
                        onClick={() => handleSend(input)}
                        disabled={!input.trim() || isLoading}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          flexShrink: 0,
                          background:
                            !input.trim() || isLoading
                              ? "var(--bg-tertiary)"
                              : "var(--accent)",
                          color: !input.trim() || isLoading ? "var(--text-muted)" : "#fff",
                          border: "none",
                          cursor:
                            !input.trim() || isLoading ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background 150ms ease",
                        }}
                      >
                        <IconSend />
                      </motion.button>
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

/* ── Header button ── */
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
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      {...rest}
      style={{
        width: 28,
        height: 28,
        borderRadius: "7px",
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
          el.style.background = "var(--bg-tertiary)";
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
    </motion.button>
  );
}
