import { useParams } from 'react-router-dom';
import SubjectChat from '../features/subject-chat/SubjectChat';
export default function SubjectChatPage() { const { subjectId } = useParams(); return <SubjectChat subjectId={subjectId} />; }
