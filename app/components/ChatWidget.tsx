"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  SparklesIcon,
  XMarkIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowUpIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { renderMarkdown } from "@/lib/utils/markdown";


interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/* ─── Single Message Bubble (Sharp Editorial Geometry + Smooth Spring Entrance) ─── */
function MessageBubble({
  msg,
  isStreaming,
  typingLabel,
}: {
  msg: Message;
  isStreaming: boolean;
  typingLabel: string;
}) {
  const isUser = msg.role === "user";
  const isEmpty = msg.content === "" && isStreaming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 32,
        mass: 0.65,
      }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        alignItems: "flex-start",
        gap: "10px",
        transformOrigin: isUser ? "100% 100%" : "0% 100%",
      }}
    >
      {/* Assistant Avatar Square */}
      {!isUser && (
        <div
          className="flex-shrink-0 mt-0.5"
          style={{
            width: 28,
            height: 28,
            borderRadius: 0,
            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
          }}
        >
          <SparklesIcon className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Bubble Surface — Sharp Architectural Corners, No Heavy Shadow */}
      <div
        style={{
          maxWidth: "82%",
          padding: isEmpty ? "9px 14px" : "10px 14px",
          borderRadius: 0,
          fontSize: "0.84375rem",
          lineHeight: 1.62,
          wordBreak: "break-word",
          overflowWrap: "break-word",
          ...(isUser
            ? {
                background: "var(--accent)",
                color: "#ffffff",
                border: "1px solid var(--accent)",
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
          <span
            className="animate-pulse"
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              letterSpacing: "0.02em",
            }}
          >
            {typingLabel}
          </span>
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

/**
 * ChatWidget — 2026 Minimalist Editorial AI Assistant
 * - Konsisten dengan geometri tajam landing page (borderRadius: 0)
 * - Shadow sangat halus dan bersih
 * - Transisi buka, tutup, maximize, dan minimize terinterpolasi mulus dari sudut kanan bawah
 * - Indikator mengetik simpel ("mengetik..." / "typing...")
 */
export function ChatWidget() {
  const { language } = useLanguage();
  const dictEntry = dictionaries[language];
  const dict =
    "chat" in dictEntry && dictEntry.chat
      ? dictEntry.chat
      : {
          assistantName: "Asisten Chat",
          welcomeMessage:
            "Hai! Saya Asisten Chat portfolio Farhan. Mau tanya apa?",
          placeholder: "Tanya tentang Farhan...",
          suggestedQ1: "Apa keahlian Farhan?",
          suggestedQ2: "Ceritakan project-nya",
          suggestedQ3: "Pengalaman kerja",
          errorMessage: "Maaf, terjadi kesalahan. Coba lagi ya.",
          typing: "mengetik...",
          online: "online",
        };

  const simpleTypingText = language === "id" ? "mengetik..." : "typing...";

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([
      { id: "welcome", role: "assistant", content: dict.welcomeMessage },
    ]);
  }, [language, dict.welcomeMessage]);

  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener("open-chat", handleOpenEvent);
    return () => window.removeEventListener("open-chat", handleOpenEvent);
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      if (window.innerWidth > 768) {
        const t = setTimeout(() => inputRef.current?.focus(), 160);
        return () => clearTimeout(t);
      }
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (isOpen) {
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
        content: text.trim(),
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
          body: JSON.stringify({
            message: text.trim(),
            lang: language,
            history,
          }),
        });

        if (response.status === 429) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId
                ? {
                    ...m,
                    content: "Terlalu banyak pesan. Tunggu sebentar ya.",
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
              const parsed: unknown = JSON.parse(line.slice(6));
              if (parsed && typeof parsed === "object") {
                if ("replace" in parsed && typeof parsed.replace === "string") {
                  current = parsed.replace;
                } else if ("text" in parsed && typeof parsed.text === "string") {
                  current += parsed.text;
                } else if (
                  "error" in parsed &&
                  typeof parsed.error === "string"
                ) {
                  current = parsed.error;
                }
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

  const toggleMinimize = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      if (next) {
        setIsFullscreen(false);
      }
      return next;
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        setIsMinimized(false);
      }
      return next;
    });
  };

  const resetChat = () => {
    if (isLoading) return;
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content: dict.welcomeMessage,
      },
    ]);
  };

  // All 3 states anchor to bottom + right with explicit width & height so CSS transitions interpolate smoothly at 60fps
  const getPanelGeometry = (): CSSProperties => {
    if (isMinimized) {
      return {
        bottom: 24,
        right: 20,
        width: "min(290px, calc(100vw - 32px))",
        height: 52,
      };
    }

    if (isFullscreen) {
      return {
        bottom: 16,
        right: 16,
        width: "calc(100vw - 32px)",
        height: "calc(100dvh - 32px)",
      };
    }

    return {
      bottom: 24,
      right: 20,
      width: "min(395px, calc(100vw - 32px))",
      height: "min(560px, calc(100dvh - 96px))",
    };
  };

  const hasText = input.trim().length > 0;

  return (
    <>
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: var(--border);
        }
        .chat-scroll { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
        .chat-input::placeholder { color: var(--text-muted); }
      `}</style>

      {/* ── Floating Trigger Button (Sharp Architectural Box, Subtle Shadow) ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={openChat}
            className="fixed z-[200] bottom-5 right-5 md:bottom-7 md:right-7 px-3.5 py-2.5 flex items-center gap-2.5 cursor-pointer group"
            style={{
              borderRadius: 0,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              boxShadow: "0 6px 20px -8px rgba(0, 0, 0, 0.2)",
              transition: "border-color 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            aria-label="Buka Asisten Chat"
          >
            <span
              className="w-7 h-7 flex items-center justify-center"
              style={{
                borderRadius: 0,
                background: "var(--accent)",
                color: "#ffffff",
              }}
            >
              <SparklesIcon className="w-3.5 h-3.5" />
            </span>

            <div className="hidden sm:flex flex-col items-start pr-1">
              <span
                className="text-xs font-semibold leading-none"
                style={{
                  fontFamily: "var(--font-plus-jakarta), sans-serif",
                  color: "var(--text-primary)",
                }}
              >
                {dict.assistantName}
              </span>
              <span
                className="text-[10px] font-medium mt-1 flex items-center gap-1 leading-none"
                style={{ color: "var(--green)" }}
              >
                <span
                  className="w-1.5 h-1.5 inline-block"
                  style={{ background: "var(--green)" }}
                />
                {dict.online}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Fullscreen Scrim Backdrop */}
            <AnimatePresence>
              {isFullscreen && !isMinimized && (
                <motion.div
                  key="backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  onClick={() => setIsFullscreen(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 199,
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    background: "rgba(9, 9, 11, 0.45)",
                  }}
                />
              )}
            </AnimatePresence>

            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "fixed",
                zIndex: 200,
                borderRadius: 0,
                ...getPanelGeometry(),
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                boxShadow: "0 10px 30px -12px rgba(0, 0, 0, 0.22)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                transformOrigin: "bottom right",
                transition:
                  "width 0.34s cubic-bezier(0.22, 1, 0.36, 1), height 0.34s cubic-bezier(0.22, 1, 0.36, 1), bottom 0.34s cubic-bezier(0.22, 1, 0.36, 1), right 0.34s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {/* ── Header Bar ── */}
              <div
                onClick={() => {
                  if (isMinimized) setIsMinimized(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: 52,
                  padding: "0 14px",
                  background: "var(--bg-primary)",
                  borderBottom: isMinimized
                    ? "none"
                    : "1px solid var(--border)",
                  flexShrink: 0,
                  userSelect: "none",
                  cursor: isMinimized ? "pointer" : "default",
                }}
              >
                {/* Left: Assistant Identity */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div
                      style={{
                        width: 30,
                        height: 30,
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
                      <SparklesIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div
                      className="truncate"
                      style={{
                        fontFamily: "var(--font-plus-jakarta), sans-serif",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        lineHeight: 1.2,
                      }}
                    >
                      {dict.assistantName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6875rem",
                        fontFamily: "var(--font-plus-jakarta), sans-serif",
                        color: isLoading ? "var(--accent)" : "var(--green)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      ● {isLoading ? simpleTypingText : dict.online}
                    </div>
                  </div>
                </div>

                {/* Right: Window Controls */}
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isMinimized && messages.length > 1 && (
                    <HeaderBtn
                      onClick={resetChat}
                      aria-label="Reset conversation"
                      title={
                        language === "id"
                          ? "Mulai ulang percakapan"
                          : "Reset conversation"
                      }
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5" />
                    </HeaderBtn>
                  )}

                  <HeaderBtn
                    onClick={toggleMinimize}
                    aria-label={isMinimized ? "Restore" : "Minimize"}
                    title={isMinimized ? "Restore" : "Minimize"}
                  >
                    <MinusIcon className="w-4 h-4" />
                  </HeaderBtn>

                  <HeaderBtn
                    onClick={toggleFullscreen}
                    aria-label={
                      isFullscreen ? "Exit fullscreen" : "Fullscreen"
                    }
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? (
                      <ArrowsPointingInIcon className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
                    )}
                  </HeaderBtn>

                  <HeaderBtn
                    onClick={closeChat}
                    aria-label="Close"
                    title="Close"
                    danger
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </HeaderBtn>
                </div>
              </div>

              {/* ── Body ── */}
              <AnimatePresence initial={false}>
                {!isMinimized && (
                  <motion.div
                    key="chat-body"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    {/* Messages Stream */}
                    <div
                      className="chat-scroll"
                      data-lenis-prevent
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: isFullscreen ? "24px 12%" : "16px 14px",
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
                          typingLabel={simpleTypingText}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompt Chips (Sharp Editorial Style) */}
                    {messages.length <= 2 && !isLoading && (
                      <div
                        style={{
                          padding: isFullscreen
                            ? "0 12% 10px"
                            : "0 14px 10px",
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
                            type="button"
                            onClick={() => handleSend(q)}
                            className="inline-flex items-center gap-1.5 transition-colors duration-200"
                            style={{
                              fontSize: "0.71875rem",
                              fontFamily:
                                "var(--font-plus-jakarta), sans-serif",
                              fontWeight: 500,
                              color: "var(--text-secondary)",
                              background: "var(--bg-tertiary)",
                              border: "1px solid var(--border)",
                              borderRadius: 0,
                              padding: "5px 10px",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget;
                              el.style.borderColor = "var(--accent)";
                              el.style.color = "var(--text-primary)";
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget;
                              el.style.borderColor = "var(--border)";
                              el.style.color = "var(--text-secondary)";
                            }}
                          >
                            <span>{q}</span>
                            <span
                              style={{
                                color: "var(--accent)",
                                fontSize: "0.65rem",
                              }}
                            >
                              ↗
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Sharp Architectural Input Bar */}
                    <div
                      style={{
                        padding: isFullscreen
                          ? "12px 12% 16px"
                          : "10px 14px 12px",
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
                          borderRadius: 0,
                          padding: "5px 6px 5px 12px",
                          transition: "border-color 180ms ease",
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
                            fontFamily: "var(--font-plus-jakarta), sans-serif",
                            color: "var(--text-primary)",
                            outline: "none",
                            minWidth: 0,
                            opacity: isLoading ? 0.6 : 1,
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => handleSend(input)}
                          disabled={!hasText || isLoading}
                          aria-label="Kirim pesan"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 0,
                            flexShrink: 0,
                            background:
                              hasText && !isLoading
                                ? "var(--accent)"
                                : "var(--bg-tertiary)",
                            color:
                              hasText && !isLoading
                                ? "#ffffff"
                                : "var(--text-muted)",
                            border: "none",
                            cursor:
                              hasText && !isLoading ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition:
                              "background-color 180ms ease, color 180ms ease",
                          }}
                        >
                          <ArrowUpIcon className="w-4 h-4 stroke-[2]" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Window Control Button (Sharp Architectural Box) ── */
function HeaderBtn({
  children,
  onClick,
  danger,
  title,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  title?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      style={{
        width: 28,
        height: 28,
        borderRadius: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "1px solid transparent",
        color: "var(--text-secondary)",
        cursor: "pointer",
        transition:
          "background 150ms ease, color 150ms ease, border-color 150ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        if (danger) {
          el.style.background = "color-mix(in srgb, #ef4444 14%, transparent)";
          el.style.borderColor = "color-mix(in srgb, #ef4444 35%, transparent)";
          el.style.color = "#ef4444";
        } else {
          el.style.background = "var(--bg-tertiary)";
          el.style.borderColor = "var(--border)";
          el.style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "transparent";
        el.style.borderColor = "transparent";
        el.style.color = "var(--text-secondary)";
      }}
    >
      {children}
    </button>
  );
}
