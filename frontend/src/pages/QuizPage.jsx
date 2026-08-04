import { useParams } from 'react-router-dom';
import QuizPlayer from '../features/quizzes/QuizPlayer';
export default function QuizPage() { const { subjectId } = useParams(); return <QuizPlayer subjectId={subjectId} />; }
