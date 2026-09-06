import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User, RefreshCw, AlertCircle } from 'lucide-react';
import { AiEstimateBadge } from './Badges';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

const PRESET_PROMPTS = [
  'Which dish wastes the most?',
  'How much should we prepare tomorrow?',
  'Who can take our surplus right now?',
  'What was our total surplus over the last 7 days?',
];

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({
  isOpen,
  onClose,
  isEmbedded = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Hello! I am your FoodRescue AI Kitchen Assistant. I have live access to your mess attendance records, dish waste performance, and nearby recipient organizations. How can I help optimize your service today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (userText?: string) => {
    const textToSend = userText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6),
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: 'b-' + Date.now(),
        sender: 'assistant',
        text: data.reply || 'I could not generate an answer at this moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'assistant',
        text: 'Sorry, I encountered an issue connecting to the AI service: ' + err.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !isEmbedded) return null;

  const content = (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">FoodRescue Assistant</h3>
              <AiEstimateBadge size="sm" />
            </div>
            <p className="text-[11px] text-zinc-500">Grounded in local canteen store logs</p>
          </div>
        </div>

        {!isEmbedded && (
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Preset Prompts Pills */}
      <div className="px-4 py-2 border-b border-zinc-100 bg-white overflow-x-auto flex items-center gap-1.5 no-scrollbar">
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
          Quick queries:
        </span>
        {PRESET_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSend(prompt)}
            className="text-[11px] whitespace-nowrap bg-zinc-100 hover:bg-violet-50 hover:text-violet-700 text-zinc-700 px-2.5 py-1 rounded-full border border-zinc-200/80 transition-colors shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
        {messages.map((m) => {
          const isBot = m.sender === 'assistant';
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-end justify-end'}`}
            >
              {isBot && (
                <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs leading-relaxed ${
                  isBot
                    ? 'bg-zinc-100/90 text-zinc-800 rounded-tl-xs border border-zinc-200/60'
                    : 'bg-violet-600 text-white rounded-br-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div
                  className={`text-[10px] mt-1.5 flex items-center justify-between gap-2 ${
                    isBot ? 'text-zinc-600' : 'text-violet-200'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {isBot && <span>AI response</span>}
                </div>
              </div>
              {!isBot && (
                <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center shrink-0 mb-0.5 shadow-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-zinc-100 rounded-2xl rounded-tl-xs px-4 py-2.5 text-zinc-500 flex items-center gap-2 border border-zinc-200/60">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-600" />
              <span>Analyzing kitchen records...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="p-3 border-t border-zinc-200 bg-zinc-50/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="ai-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about tomorrow's prep, surplus donations..."
            className="flex-1 text-xs bg-white border border-zinc-300 rounded-lg px-3.5 py-2 text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <button
            id="ai-chat-send-btn"
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-600">
          <AlertCircle className="w-3 h-3 text-zinc-600" />
          <span>Answers reference your recent 7-day logs and partner directory.</span>
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return <div className="h-[480px] rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">{content}</div>;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-200">
      {content}
    </div>
  );
};
