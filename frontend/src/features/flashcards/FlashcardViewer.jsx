import { useEffect, useState } from 'react';
import { generateFlashcards, getFlashcards } from '../../api/endpoints/flashcards';

export default function FlashcardViewer({ subjectId }) {
  const [cards, setCards] = useState([]); const [revealed, setRevealed] = useState({});
  const load = async () => { const response = await getFlashcards(subjectId); setCards(response.data.flashcards); };
  useEffect(() => { load(); }, [subjectId]);
  const generate = async () => { await generateFlashcards(subjectId); await load(); };
  return <div className="max-w-3xl mx-auto p-6"><div className="flex justify-between"><h1 className="text-2xl font-bold">Flashcards</h1><button onClick={generate} className="bg-indigo-600 text-white rounded px-3">Generate</button></div><div className="grid gap-3 mt-5">{cards.map((card) => <button key={card._id} onClick={() => setRevealed({ ...revealed, [card._id]: !revealed[card._id] })} className="text-left p-4 bg-white border rounded"><b>{card.question}</b>{revealed[card._id] && <p className="mt-3">{card.answer}</p>}</button>)}</div></div>;
}
