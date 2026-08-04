import { useParams } from 'react-router-dom';
import FlashcardViewer from '../features/flashcards/FlashcardViewer';
export default function FlashcardsPage() { const { subjectId } = useParams(); return <FlashcardViewer subjectId={subjectId} />; }
