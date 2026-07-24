import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, Send, Sparkles, User, Trash2, Leaf, Droplets, FlaskConical, Wheat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { ChatMessage } from '../lib/types';
import { getAgriResponse } from '../lib/gemini';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { fmtRelative } from '../lib/utils';

const SUGGESTIONS = [
  { icon: Leaf, text: 'My wheat leaves are turning yellow, what should I do?' },
  { icon: Droplets, text: 'When should I irrigate my rice crop?' },
  { icon: FlaskConical, text: 'How much fertilizer does tomato need?' },
  { icon: Wheat, text: 'Which wheat variety is best for my region?' },
];

export default function AssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => (user ? db.getChat(user.id) : []));
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function sendMessage(text: string) {
    if (!user || !text.trim() || sending) return;
    setError(null);
    setInput('');

    // persist + show user message immediately
    const userMsg = db.addChatMessage(user.id, 'user', text.trim());
    setMessages((m) => [...m, userMsg]);
    setSending(true);

    try {
      // Build conversation context (last 10 messages) for Gemini.
      const history = [...messages, userMsg]
        .slice(-10)
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', content: m.content }));

      const reply = await getAgriResponse(text.trim(), history);

      const aiMsg = db.addChatMessage(user.id, 'assistant', reply);
      setMessages((m) => [...m, aiMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the AI assistant. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleClear() {
    if (!user) return;
    db.clearChat(user.id);
    setMessages([]);
    setError(null);
    setConfirmClear(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-9rem)] animate-fade-in">
      <PageHeader
        title="AgriGuide AI Assistant"
        subtitle="Ask about irrigation, fertilizers, diseases, harvest, equipment, weather, and more."
        icon={Bot}
        action={
          messages.length > 0 ? (
            <button onClick={() => setConfirmClear(true)} className="btn-secondary text-sm py-2"><Trash2 size={16} /> Clear</button>
          ) : undefined
        }
      />

      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="grid place-items-center w-16 h-16 rounded-3xl bg-forest-600 text-white shadow-glow mb-4">
                <Sparkles size={28} />
              </div>
              <h3 className="font-display text-xl font-bold text-forest-900 dark:text-forest-50">Ask AgriGuide AI</h3>
              <p className="mt-1.5 text-sm text-forest-600 dark:text-forest-300 max-w-sm text-center">
                I give simple, practical farming advice. Try one of these to get started:
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => sendMessage(s.text)}
                    disabled={sending}
                    className="flex items-start gap-3 text-left rounded-2xl bg-white/70 dark:bg-forest-900/40 border border-forest-100 dark:border-forest-800/60 p-3.5 hover:border-forest-300 hover:shadow-soft transition disabled:opacity-50"
                  >
                    <span className="grid place-items-center w-9 h-9 rounded-xl bg-forest-100 text-forest-700 dark:bg-forest-800/60 dark:text-forest-200 shrink-0">
                      <s.icon size={18} />
                    </span>
                    <span className="text-sm font-medium text-forest-700 dark:text-forest-200">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <Bubble key={m.id} message={m} />)
          )}

          {sending && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="grid place-items-center w-9 h-9 rounded-2xl bg-forest-600 text-white shrink-0"><Bot size={18} /></div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white/70 dark:bg-forest-900/40 px-4 py-3 border border-forest-100 dark:border-forest-800/60">
                <Spinner size={16} />
                <span className="text-sm text-forest-500 dark:text-forest-400">Thinking…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-forest-100 dark:border-forest-800/60 p-3 sm:p-4 bg-white/60 dark:bg-forest-900/40">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={1}
              placeholder="Ask about your crops, soil, watering…"
              className="input-field resize-none max-h-32 py-3"
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()} className="btn-primary !px-4 !py-3 shrink-0" aria-label="Send">
              {sending ? <Spinner size={18} /> : <Send size={18} />}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog open={confirmClear} title="Clear conversation?" message="All your chat history with the assistant will be removed." confirmLabel="Clear" danger icon={Trash2} onConfirm={handleClear} onCancel={() => setConfirmClear(false)} />
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-start gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`grid place-items-center w-9 h-9 rounded-2xl shrink-0 ${isUser ? 'bg-earth-500 text-white' : 'bg-forest-600 text-white'}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div className={`max-w-[80%] sm:max-w-[70%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap text-left ${
            isUser
              ? 'bg-earth-500 text-white rounded-tr-sm'
              : 'bg-white/80 dark:bg-forest-900/50 text-forest-800 dark:text-forest-100 border border-forest-100 dark:border-forest-800/60 rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>
        <p className={`mt-1 text-[11px] text-forest-400 dark:text-forest-500 ${isUser ? 'text-right' : ''}`}>{fmtRelative(message.created_at)}</p>
      </div>
    </div>
  );
}
