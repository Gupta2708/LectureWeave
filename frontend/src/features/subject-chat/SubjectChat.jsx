import { useState } from 'react';
import { createChatSession, sendChatMessage } from '../../api/endpoints/chat';

export default function SubjectChat({ subjectId }) {
  const [messages, setMessages] = useState([]); const [value, setValue] = useState(''); const [session, setSession] = useState(null);
  const send = async (event) => { event.preventDefault(); if (!value.trim()) return; let sessionId = session; if (!sessionId) { const response = await createChatSession(subjectId); sessionId = response.data.id; setSession(sessionId); } const question = value; setValue(''); setMessages((items) => [...items, { role: 'user', content: question }]); const response = await sendChatMessage(sessionId, question); setMessages((items) => [...items, { role: 'assistant', content: response.data.answer, sources: response.data.sources }]); };
  return <div className="max-w-3xl mx-auto p-6"><h1 className="text-2xl font-bold">Subject chat</h1><div className="my-5 space-y-3">{messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'text-right' : 'bg-white border rounded p-3'}>{message.content}</div>)}</div><form onSubmit={send} className="flex gap-2"><input value={value} onChange={(event) => setValue(event.target.value)} className="flex-1 border rounded p-2" placeholder="Ask about this subject"/><button className="bg-indigo-600 text-white rounded px-4">Send</button></form></div>;
}
