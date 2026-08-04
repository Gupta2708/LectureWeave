import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Sparkles, Loader2, Check, X } from 'lucide-react';
import { generateQuiz, submitQuiz } from '../../api/endpoints/quizzes';

export default function QuizPlayer({ subjectId }) {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    setResult(null);
    setAnswers({});
    try {
      const res = await generateQuiz(subjectId, { count: 5, question_types: ['mcq'], difficulty: 'medium' });
      setQuiz(res.data);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    const res = await submitQuiz(quiz.id, answers);
    setResult(res.data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resultFor = (qid) => result?.results?.find((r) => r.question_id === qid);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 to-gray-50">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Quiz</h1>
              <p className="text-xs text-gray-500">Grounded questions from your material</p>
            </div>
          </div>
          <button
            onClick={start}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:bg-gray-300"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {quiz ? 'New quiz' : 'Generate quiz'}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {result && (
          <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 px-6 py-4 text-center">
            <p className="text-sm text-indigo-700">Your score</p>
            <p className="text-3xl font-bold text-indigo-900">{result.score} / {result.total}</p>
          </div>
        )}

        {!quiz ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
            <HelpCircle className="mx-auto mb-3 h-10 w-10" />
            <p className="font-medium text-gray-500">No quiz yet</p>
            <p className="mt-1 text-sm">Generate a quiz to test yourself on this subject.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quiz.questions?.map((question, index) => {
              const r = resultFor(question._id);
              return (
                <div key={question._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="font-semibold text-gray-900">{index + 1}. {question.prompt}</p>
                  <div className="mt-3 space-y-2">
                    {question.options.map((option) => {
                      const selected = answers[question._id] === option;
                      const showCorrect = result && r && option === question.correct_answer;
                      return (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                            showCorrect
                              ? 'border-green-300 bg-green-50 text-green-800'
                              : selected
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={question._id}
                            disabled={!!result}
                            checked={selected}
                            onChange={() => setAnswers((a) => ({ ...a, [question._id]: option }))}
                          />
                          <span className="flex-1">{option}</span>
                          {showCorrect && <Check className="h-4 w-4 text-green-600" />}
                        </label>
                      );
                    })}
                  </div>
                  {result && r && (
                    <p className={`mt-3 flex items-center gap-1.5 text-sm ${r.correct ? 'text-green-700' : 'text-red-700'}`}>
                      {r.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      {r.explanation}
                    </p>
                  )}
                </div>
              );
            })}

            {!result && (
              <button
                onClick={submit}
                disabled={Object.keys(answers).length === 0}
                className="w-full rounded-xl bg-green-600 py-3 font-medium text-white shadow-sm transition hover:bg-green-700 disabled:bg-gray-300"
              >
                Submit answers
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
