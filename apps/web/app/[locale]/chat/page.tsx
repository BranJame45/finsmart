'use client';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Bot, Send, User, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export default function ChatPage() {
  const t = useTranslations('chat');
  const locale = useLocale();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carga el historial al montar.
  useEffect(() => {
    let active = true;
    api
      .get<ChatMessage[]>('/ai/chat')
      .then((history) => {
        if (active) setMessages(history);
      })
      .catch(() => {
        /* Sin historial disponible: se muestra el estado vacío. */
      });
    return () => {
      active = false;
    };
  }, []);

  // Auto-scroll al último mensaje en cada cambio.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;

    // Burbuja optimista del usuario.
    const optimisticUser: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput('');
    setSending(true);

    try {
      const res = await api.post<ChatResponse>('/ai/chat', { message, lang: locale });
      // Reemplaza la burbuja optimista por la confirmada y agrega la respuesta.
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        res.userMessage,
        res.assistantMessage,
      ]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('error'),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const suggestions = [t('suggestion1'), t('suggestion2'), t('suggestion3')];
  const isEmpty = messages.length === 0 && !sending;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('title')}</h1>

      <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Lista de mensajes (scrollable). */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <Bot className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{t('greeting')}</h2>
              <p className="text-gray-500 mt-2 max-w-md">{t('intro')}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    disabled={sending}
                    className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full px-4 py-2 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 shrink-0">
                        <Bot className="w-5 h-5 text-emerald-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${
                        isUser ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {isUser && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}

              {sending && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 shrink-0">
                    <Bot className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="bg-gray-100 text-gray-500 rounded-2xl px-4 py-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                      </span>
                      {t('loading')}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input fijo abajo. */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-gray-200 p-3 sm:p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            disabled={sending}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t('send')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
