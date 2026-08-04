import { useState } from 'react';
import { generateQuiz, submitQuiz } from '../../api/endpoints/quizzes';

export default function QuizPlayer({ subjectId }) {
  const [quiz, setQuiz] = useState(null); const [answers, setAnswers] = useState({}); const [result, setResult] = useState(null);
  const start = async () => { const response = await generateQuiz(subjectId, { count: 5, question_types: ['mcq'], difficulty: 'medium' }); setQuiz(response.data); setResult(null); };
  const submit = async () => { const response = await submitQuiz(quiz.id, answers); setResult(response.data); };
  return <div className="max-w-3xl mx-auto p-6"><div className="flex justify-between"><h1 className="text-2xl font-bold">Quiz</h1><button onClick={start} className="bg-indigo-600 text-white rounded px-3">Generate quiz</button></div>{quiz?.questions?.map((question, index) => <div key={question._id} className="p-4 bg-white border rounded mt-4"><p>{index + 1}. {question.prompt}</p>{question.options.map((option) => <label key={option} className="block mt-2"><input type="radio" name={question._id} onChange={() => setAnswers({ ...answers, [question._id]: option })}/> {option}</label>)}</div>)}{quiz && <button onClick={submit} className="mt-4 bg-green-600 text-white rounded px-3 py-2">Submit</button>}{result && <p className="mt-4 font-medium">Score: {result.score}/{result.total}</p>}</div>;
}
