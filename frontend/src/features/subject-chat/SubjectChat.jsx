import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { createChatSession, sendChatMessage } from '../../api/endpoints/chat';
import CitationMarkdown from '../citations/CitationMarkdown';
import CitationDrawer from '../citations/CitationDrawer';

export default function SubjectChat({ subjectId }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState('');
  const [session, setSession] = useState(null);
  const [sending, setSending] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (e) => {
    e.preventDefault();
    const question = value.trim();
    if (!question || sending) return;
    setValue('');
    setSending(true);
    setMessages((m) => [...m, { role: 'user', content: question }]);
    try {
      let sessionId = session;
      if (!sessionId) {
        const res = await createChatSession(subjectId);
        sessionId = res.data.id;
        setSession(sessionId);
      }
      const res = await sendChatMessage(sessionId, question);
      setMessages((m) => [...m, { role: 'assistant', content: res.data.answer, sources: res.data.sources || [] }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry — something went wrong answering that.', sources: [], error: true }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-indigo-50/40 to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Subject chat</h1>
            <p className="text-xs text-gray-500">Answers grounded in your uploaded material</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {messages.length === 0 && !sending && (
            <div className="mt-16 flex flex-col items-center text-center text-gray-400">
              <MessageSquare className="mb-3 h-10 w-10" />
              <p className="font-medium text-gray-500">Ask anything about this subject</p>
              <p className="mt-1 text-sm">Try “Explain logistic regression from my notes”</p>
            </div>
          )}

          {messages.map((message, index) =>
            message.role === 'user' ? (
              <div key={index} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2.5 text-white shadow-sm">
                  {message.content}
                </div>
              </div>
            ) : (
              <div key={index} className="flex justify-start">
                <div className={`max-w-[85%] rounded-2xl rounded-bl-sm border px-4 py-3 shadow-sm ${message.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-800'}`}>
                  <CitationMarkdown
                    markdown={message.content}
                    onCitation={(id) => setActiveCitation((message.sources || []).find((s) => s.id === id) || null)}
                  />
                  {message.sources?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2">
                      <span className="text-xs text-gray-400">Sources:</span>
                      {message.sources.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setActiveCitation(s)}
                          className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          {s.id}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> Thinking…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur">
        <form onSubmit={send} className="mx-auto flex max-w-3xl gap-2 px-4 py-4">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask about this subject…"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            disabled={!value.trim() || sending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </form>
      </div>

      <CitationDrawer citation={activeCitation} onClose={() => setActiveCitation(null)} />
    </div>
  );
}
