import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Sparkles, Loader2, RotateCw } from 'lucide-react';
import { generateFlashcards, getFlashcards } from '../../api/endpoints/flashcards';

export default function FlashcardViewer({ subjectId }) {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [revealed, setRevealed] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getFlashcards(subjectId);
      setCards(res.data.flashcards || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [subjectId]);

  const generate = async () => {
    setGenerating(true);
    try {
      await generateFlashcards(subjectId);
      await load();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 to-gray-50">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Flashcards</h1>
              <p className="text-xs text-gray-500">Grounded in your subject material</p>
            </div>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:bg-gray-300"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20 text-gray-400"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
            <Layers className="mx-auto mb-3 h-10 w-10" />
            <p className="font-medium text-gray-500">No flashcards yet</p>
            <p className="mt-1 text-sm">Generate a set from your uploaded material and lectures.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <button
                key={card._id}
                onClick={() => setRevealed((r) => ({ ...r, [card._id]: !r[card._id] }))}
                className="group flex min-h-[140px] flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  {card.topic && <span className="mb-2 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{card.topic}</span>}
                  <p className="font-semibold text-gray-900">{card.question}</p>
                  {revealed[card._id] && <p className="mt-3 text-sm leading-relaxed text-gray-600">{card.answer}</p>}
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                  <RotateCw className="h-3.5 w-3.5" /> {revealed[card._id] ? 'Hide answer' : 'Reveal answer'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
