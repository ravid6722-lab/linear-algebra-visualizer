import { useEffect, useMemo, useState } from 'react';
import { socket } from '../api/socketClient.js';
import LatexText from './LatexText.jsx';
import {
  addQuestionToTopic as addLocalQuestionToTopic,
  createTopic as createLocalTopic,
  loadQuizTopics,
  saveQuizTopics,
  updateTopic as updateLocalTopic,
  updateQuestionInTopic as updateLocalQuestionInTopic,
  deleteTopic as deleteLocalTopic,
  deleteQuestionFromTopic as deleteLocalQuestionFromTopic,
} from '../utils/quizStorage.js';
import { quizWithoutExplanations } from '../data/quizzes.js';
import {
  addQuestionToTopic as addServerQuestionToTopic,
  createQuizTopic,
  deleteQuizQuestion as deleteServerQuestion,
  deleteQuizTopic as deleteServerTopic,
  fetchQuizTopics,
  updateQuizQuestion as updateServerQuestion,
  updateQuizTopic as updateServerTopic,
} from '../api/quizLibraryApi.js';

function inferConceptFromTopic(topic) {
  const text = `${topic?.id || ''} ${topic?.title || ''}`.toLowerCase();

  if (text.includes('eigen')) return 'eigen';
  if (text.includes('determinant')) return 'determinant';
  if (text.includes('combination')) return 'combination';
  if (text.includes('basis')) return 'basis';
  if (text.includes('span')) return 'span';
  if (text.includes('transform')) return 'transformation';

  return 'transformation';
}


function normalizeLibraryQuestion(question, topic) {
  const questionId = question.questionId || question.id || `${topic.id}-question-${Date.now()}`;
  return {
    ...question,
    id: question.id || questionId,
    questionId,
    topicId: question.topicId || topic.id,
    topicTitle: question.topicTitle || topic.title,
    concept: question.concept || topic.concept || inferConceptFromTopic(topic),
    options: Array.isArray(question.options) ? question.options : [],
    correctIndex: Number(question.correctIndex),
  };
}

function normalizeLibraryTopics(value) {
  if (!Array.isArray(value)) return [];
  return value.map((topic) => {
    const safeTopic = {
      ...topic,
      id: topic.id,
      title: String(topic.title || 'נושא ללא כותרת').trim(),
      concept: topic.concept || inferConceptFromTopic(topic),
      questions: [],
    };
    safeTopic.questions = Array.isArray(topic.questions)
      ? topic.questions.map((question) => normalizeLibraryQuestion(question, safeTopic))
      : [];
    return safeTopic;
  }).filter((topic) => topic.id && topic.title);
}

function makeLiveQuiz(baseQuiz) {
  return {
    ...quizWithoutExplanations(baseQuiz),
    questionId: `${baseQuiz.questionId}-live-${Date.now()}`,
    libraryQuestionId: baseQuiz.questionId,
    openedAt: new Date().toISOString(),
    answerRevealed: false,
  };
}

function getLibraryQuestionId(quiz) {
  if (!quiz) return '';
  return quiz.libraryQuestionId || quiz.sourceQuestionId || quiz.originalQuestionId || quiz.questionId || '';
}

function emptyResultsFor(quiz) {
  return {
    questionId: quiz?.questionId || '',
    totalResponses: 0,
    distribution: Array.from({ length: quiz?.options?.length || 4 }, () => 0),
    correctPct: 0,
    answerRevealed: quiz?.answerRevealed === true,
    studentStatuses: [],
  };
}

function answerLetter(choiceIndex) {
  return Number.isInteger(choiceIndex) ? String.fromCharCode(65 + choiceIndex) : '—';
}

function makeEmptyQuestionForm() {
  return {
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  };
}

function StudentAnswersPanel({ results, quiz, answerRevealed }) {
  const studentStatuses = results?.studentStatuses || [];

  return (
    <div className="student-answers-panel">
      <div className="student-answers-header">
        <div>
          <div className="section-title">תשובות הסטודנטים</div>
          <p>מציג בזמן אמת מי ענה על הבוחן הפעיל.</p>
        </div>
        <span className="dashboard-badge">{studentStatuses.length} סטודנטים</span>
      </div>

      {studentStatuses.length === 0 ? (
        <div className="empty-table-note">עדיין אין סטודנטים מחוברים לבוחן זה.</div>
      ) : (
        <div className="student-answer-table-wrap">
          <table className="student-answer-table">
            <thead>
              <tr>
                <th>כינוי</th>
                <th>מצב</th>
                <th>תשובה</th>
                {answerRevealed && <th>תוצאה</th>}
              </tr>
            </thead>
            <tbody>
              {studentStatuses.map((student) => {
                const hasAnswered = student.hasAnswered === true;
                const choiceIndex = Number.isInteger(student.choiceIndex) ? student.choiceIndex : null;
                const isCorrect = answerRevealed && hasAnswered && choiceIndex === quiz.correctIndex;
                const isIncorrect = answerRevealed && hasAnswered && choiceIndex !== quiz.correctIndex;

                return (
                  <tr key={student.socketId || student.nickname}>
                    <td data-label="כינוי">{student.nickname || 'סטודנט'}</td>
                    <td data-label="מצב">
                      <span className={`status-badge ${hasAnswered ? 'answered' : 'waiting'}`}>
                        {hasAnswered ? 'ענה/תה' : 'ממתין/ה'}
                      </span>
                    </td>
                    <td data-label="תשובה">
                      {!hasAnswered && '—'}
                      {hasAnswered && !answerRevealed && 'מוסתרת'}
                      {hasAnswered && answerRevealed && answerLetter(choiceIndex)}
                    </td>
                    {answerRevealed && (
                      <td data-label="תוצאה">
                        {!hasAnswered && <span className="status-badge no-answer">ללא תשובה</span>}
                        {isCorrect && <span className="status-badge correct">נכון</span>}
                        {isIncorrect && <span className="status-badge incorrect">שגוי</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function QuizCard({ joinCode }) {
  const [topics, setTopics] = useState(() => loadQuizTopics());
  const [librarySource, setLibrarySource] = useState('local');
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState(() => loadQuizTopics()[0]?.id || '');
  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) || null,
    [topics, selectedTopicId],
  );
  const [selectedQuestionId, setSelectedQuestionId] = useState(() => loadQuizTopics()[0]?.questions?.[0]?.questionId || '');
  const selectedQuestion = useMemo(
    () => selectedTopic?.questions?.find((question) => question.questionId === selectedQuestionId) || null,
    [selectedTopic, selectedQuestionId],
  );

  const [liveQuiz, setLiveQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [libraryMessage, setLibraryMessage] = useState('');
  const [libraryError, setLibraryError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [topicForm, setTopicForm] = useState({ title: '' });
  const [questionForm, setQuestionForm] = useState(makeEmptyQuestionForm);
  const [questionTopicId, setQuestionTopicId] = useState(selectedTopicId);
  const [deleteTopicId, setDeleteTopicId] = useState(selectedTopicId);
  const [deleteQuestionTopicId, setDeleteQuestionTopicId] = useState(selectedTopicId);
  const [deleteQuestionId, setDeleteQuestionId] = useState('');
  const [editTopicId, setEditTopicId] = useState(selectedTopicId);
  const [editTopicForm, setEditTopicForm] = useState({ title: '' });
  const [editQuestionTopicId, setEditQuestionTopicId] = useState(selectedTopicId);
  const [editQuestionId, setEditQuestionId] = useState('');
  const [editQuestionForm, setEditQuestionForm] = useState(makeEmptyQuestionForm);

  useEffect(() => {
    let isMounted = true;

    async function loadServerLibrary() {
      setLibraryLoading(true);
      setLibraryError('');
      try {
        const serverTopics = normalizeLibraryTopics(await fetchQuizTopics());
        if (!isMounted) return;

        if (serverTopics.length === 0) {
          throw new Error('מאגר השאלות בשרת לא החזיר נושאים.');
        }

        setTopics(serverTopics);
        setSelectedTopicId((current) => current && serverTopics.some((topic) => topic.id === current) ? current : serverTopics[0]?.id || '');
        setQuestionTopicId((current) => current && serverTopics.some((topic) => topic.id === current) ? current : serverTopics[0]?.id || '');
        setEditTopicId((current) => current && serverTopics.some((topic) => topic.id === current) ? current : serverTopics[0]?.id || '');
        setEditQuestionTopicId((current) => current && serverTopics.some((topic) => topic.id === current) ? current : serverTopics[0]?.id || '');
        setSelectedQuestionId((current) => {
          if (serverTopics.some((topic) => topic.questions.some((question) => question.questionId === current))) return current;
          return serverTopics[0]?.questions?.[0]?.questionId || '';
        });
        setLibrarySource('server');
        setLibraryMessage('מאגר שאלות: מסד הנתונים בשרת');
      } catch (error) {
        if (!isMounted) return;
        const localTopics = loadQuizTopics();
        setTopics(localTopics);
        setSelectedTopicId((current) => current && localTopics.some((topic) => topic.id === current) ? current : localTopics[0]?.id || '');
        setQuestionTopicId((current) => current && localTopics.some((topic) => topic.id === current) ? current : localTopics[0]?.id || '');
        setEditTopicId((current) => current && localTopics.some((topic) => topic.id === current) ? current : localTopics[0]?.id || '');
        setEditQuestionTopicId((current) => current && localTopics.some((topic) => topic.id === current) ? current : localTopics[0]?.id || '');
        setSelectedQuestionId((current) => {
          if (localTopics.some((topic) => topic.questions.some((question) => question.questionId === current))) return current;
          return localTopics[0]?.questions?.[0]?.questionId || '';
        });
        setLibrarySource('local');
        setLibraryError('נעשה שימוש במאגר מקומי משום שמאגר השרת אינו זמין.');
        console.warn('Server quiz library unavailable. Falling back to localStorage.', error);
      } finally {
        if (isMounted) setLibraryLoading(false);
      }
    }

    loadServerLibrary();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTopicId && topics[0]) {
      setSelectedTopicId(topics[0].id);
      setSelectedQuestionId(topics[0].questions?.[0]?.questionId || '');
      return;
    }

    if (selectedTopic && !selectedTopic.questions.some((question) => question.questionId === selectedQuestionId)) {
      setSelectedQuestionId(selectedTopic.questions?.[0]?.questionId || '');
    }
  }, [topics, selectedTopicId, selectedTopic, selectedQuestionId]);


  useEffect(() => {
    if (!questionTopicId && selectedTopicId) {
      setQuestionTopicId(selectedTopicId);
    }
  }, [questionTopicId, selectedTopicId]);

  useEffect(() => {
    const topicIds = new Set(topics.map((topic) => topic.id));
    const fallbackTopicId = selectedTopicId || topics[0]?.id || '';

    if (!deleteTopicId || !topicIds.has(deleteTopicId)) {
      setDeleteTopicId(fallbackTopicId);
    }

    if (!deleteQuestionTopicId || !topicIds.has(deleteQuestionTopicId)) {
      setDeleteQuestionTopicId(fallbackTopicId);
      const fallbackTopic = topics.find((topic) => topic.id === fallbackTopicId);
      setDeleteQuestionId(fallbackTopic?.questions?.[0]?.questionId || '');
      return;
    }

    const questionTopic = topics.find((topic) => topic.id === deleteQuestionTopicId);
    const questionIds = new Set((questionTopic?.questions || []).map((question) => question.questionId));
    if (!deleteQuestionId || !questionIds.has(deleteQuestionId)) {
      setDeleteQuestionId(questionTopic?.questions?.[0]?.questionId || '');
    }
  }, [topics, selectedTopicId, deleteTopicId, deleteQuestionTopicId, deleteQuestionId]);


  useEffect(() => {
    const topicIds = new Set(topics.map((topic) => topic.id));
    const fallbackTopicId = selectedTopicId || topics[0]?.id || '';

    if (!editTopicId || !topicIds.has(editTopicId)) {
      setEditTopicId(fallbackTopicId);
    }

    const editTopic = topics.find((topic) => topic.id === (editTopicId || fallbackTopicId));
    setEditTopicForm({ title: editTopic?.title || '' });

    if (!editQuestionTopicId || !topicIds.has(editQuestionTopicId)) {
      setEditQuestionTopicId(fallbackTopicId);
      const fallbackTopic = topics.find((topic) => topic.id === fallbackTopicId);
      setEditQuestionId(fallbackTopic?.questions?.[0]?.questionId || '');
      return;
    }

    const questionTopic = topics.find((topic) => topic.id === editQuestionTopicId);
    const questionIds = new Set((questionTopic?.questions || []).map((question) => question.questionId));
    if (!editQuestionId || !questionIds.has(editQuestionId)) {
      setEditQuestionId(questionTopic?.questions?.[0]?.questionId || '');
    }
  }, [topics, selectedTopicId, editTopicId, editQuestionTopicId, editQuestionId]);

  useEffect(() => {
    const topic = topics.find((item) => item.id === editQuestionTopicId) || null;
    const question = topic?.questions?.find((item) => item.questionId === editQuestionId) || null;
    if (!question) {
      setEditQuestionForm(makeEmptyQuestionForm());
      return;
    }

    setEditQuestionForm({
      question: question.question || '',
      options: Array.isArray(question.options) ? [...question.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      correctIndex: Number.isInteger(Number(question.correctIndex)) ? Number(question.correctIndex) : 0,
    });
  }, [topics, editQuestionTopicId, editQuestionId]);

  useEffect(() => {
    setLiveQuiz(null);
    setQuizResults(null);
    setAnswerRevealed(false);
    setStatus(joinCode ? 'הבוחן החי עדיין אינו פתוח.' : 'יש להתחיל מפגש חי כדי להשתמש בבוחן חי.');
    setError('');
  }, [joinCode]);

  useEffect(() => {
    function handleResults(results) {
      setQuizResults(results);
      if (results?.answerRevealed === true) {
        setAnswerRevealed(true);
        setLiveQuiz((currentQuiz) => currentQuiz ? { ...currentQuiz, answerRevealed: true } : currentQuiz);
      }
    }

    function handleAnswerRevealed(payload = {}) {
      setAnswerRevealed(true);
      setLiveQuiz((currentQuiz) => {
        if (!currentQuiz) return currentQuiz;
        if (payload.questionId && payload.questionId !== currentQuiz.questionId) return currentQuiz;
        return {
          ...currentQuiz,
          answerRevealed: true,
          correctIndex: Number.isInteger(payload.correctIndex) ? payload.correctIndex : currentQuiz.correctIndex,
        };
      });
      if (payload.results) setQuizResults(payload.results);
      setStatus('התשובה נחשפה לכיתה.');
    }

    function handleClosed() {
      setLiveQuiz(null);
      setQuizResults(null);
      setAnswerRevealed(false);
      setStatus('הבוחן החי נסגר.');
    }

    socket.on('quiz:results', handleResults);
    socket.on('quiz:answer-revealed', handleAnswerRevealed);
    socket.on('quiz:closed', handleClosed);

    return () => {
      socket.off('quiz:results', handleResults);
      socket.off('quiz:answer-revealed', handleAnswerRevealed);
      socket.off('quiz:closed', handleClosed);
    };
  }, []);

  function handleSelectTopic(topicId) {
    const nextTopic = topics.find((topic) => topic.id === topicId) || null;
    setSelectedTopicId(topicId);
    setQuestionTopicId(topicId);
    setSelectedQuestionId(nextTopic?.questions?.[0]?.questionId || '');
    setError('');
  }

  async function refreshServerTopics(preferredTopicId = '', preferredQuestionId = '') {
    const serverTopics = normalizeLibraryTopics(await fetchQuizTopics());
    setTopics(serverTopics);
    setLibrarySource('server');

    const nextTopicId = preferredTopicId && serverTopics.some((topic) => topic.id === preferredTopicId)
      ? preferredTopicId
      : serverTopics[0]?.id || '';
    const nextTopic = serverTopics.find((topic) => topic.id === nextTopicId) || null;
    const nextQuestionId = preferredQuestionId && nextTopic?.questions?.some((question) => question.questionId === preferredQuestionId)
      ? preferredQuestionId
      : nextTopic?.questions?.[0]?.questionId || '';

    setSelectedTopicId(nextTopicId);
    setQuestionTopicId(nextTopicId);
    setSelectedQuestionId(nextQuestionId);
    return serverTopics;
  }

  async function handleAddTopic(event) {
    event.preventDefault();
    setLibraryError('');
    setLibraryMessage('');

    const title = topicForm.title.trim();
    if (!title) {
      setLibraryError('יש להזין כותרת לנושא.');
      return;
    }

    if (librarySource === 'server') {
      try {
        setIsBusy(true);
        const topic = await createQuizTopic(title);
        const nextTopics = await refreshServerTopics(topic.id, '');
        setSelectedTopicId(topic.id);
        setQuestionTopicId(topic.id);
        setSelectedQuestionId(nextTopics.find((item) => item.id === topic.id)?.questions?.[0]?.questionId || '');
        setTopicForm({ title: '' });
        setLibraryMessage('הנושא נוסף. כעת ניתן להוסיף אליו שאלות.');
      } catch (error) {
        setLibraryError(error.message || 'לא ניתן היה להוסיף את הנושא למסד הנתונים בשרת.');
      } finally {
        setIsBusy(false);
      }
      return;
    }

    const topic = createLocalTopic(title);
    const nextTopics = saveQuizTopics([...topics, topic]);
    setTopics(nextTopics);
    setSelectedTopicId(topic.id);
    setQuestionTopicId(topic.id);
    setSelectedQuestionId('');
    setTopicForm({ title: '' });
    setLibraryMessage('הנושא נוסף. כעת ניתן להוסיף אליו שאלות.');
  }

  function handleQuestionOptionChange(index, value) {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index ? value : option),
    }));
  }


  function handleEditQuestionOptionChange(index, value) {
    setEditQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index ? value : option),
    }));
  }

  async function handleEditTopic(event) {
    event.preventDefault();
    setLibraryError('');
    setLibraryMessage('');

    const topic = topics.find((item) => item.id === editTopicId) || null;
    const title = editTopicForm.title.trim();

    if (!topic) {
      setLibraryError('יש לבחור נושא לעריכה.');
      return;
    }

    if (!title) {
      setLibraryError('יש להזין כותרת לנושא.');
      return;
    }

    if (librarySource === 'server') {
      try {
        setIsBusy(true);
        await updateServerTopic(topic.id, { title });
        await refreshServerTopics(topic.id, selectedQuestionId);
        setLibraryMessage('הנושא עודכן.');
      } catch (error) {
        setLibraryError(error.message || 'לא ניתן היה לעדכן את הנושא במסד הנתונים בשרת.');
      } finally {
        setIsBusy(false);
      }
      return;
    }

    const nextTopics = updateLocalTopic(topic.id, { title });
    setTopics(nextTopics);
    setLibraryMessage('הנושא עודכן במאגר המקומי.');
  }

  async function handleEditQuestion(event) {
    event.preventDefault();
    setLibraryError('');
    setLibraryMessage('');

    const topic = topics.find((item) => item.id === editQuestionTopicId) || null;
    const question = topic?.questions?.find((item) => item.questionId === editQuestionId) || null;
    const questionText = editQuestionForm.question.trim();
    const options = editQuestionForm.options.map((option) => option.trim());
    const correctIndex = Number(editQuestionForm.correctIndex);

    if (!topic) {
      setLibraryError('יש לבחור נושא לפני עריכת שאלה.');
      return;
    }

    if (!question) {
      setLibraryError('יש לבחור שאלה לעריכה.');
      return;
    }

    if (!questionText) {
      setLibraryError('יש להזין את נוסח השאלה.');
      return;
    }

    if (options.some((option) => !option)) {
      setLibraryError('יש למלא את כל ארבע אפשרויות התשובה.');
      return;
    }

    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      setLibraryError('התשובה הנכונה חייבת להיות אחת מהאפשרויות A, B, C או D.');
      return;
    }

    const patch = { question: questionText, options, correctIndex };

    if (librarySource === 'server') {
      try {
        setIsBusy(true);
        await updateServerQuestion(topic.id, question.questionId, patch);
        await refreshServerTopics(topic.id, question.questionId);
        setEditQuestionTopicId(topic.id);
        setEditQuestionId(question.questionId);
        setLibraryMessage('השאלה עודכנה.');
      } catch (error) {
        setLibraryError(error.message || 'לא ניתן היה לעדכן את השאלה במסד הנתונים בשרת.');
      } finally {
        setIsBusy(false);
      }
      return;
    }

    const nextTopics = updateLocalQuestionInTopic(topic.id, question.questionId, patch);
    setTopics(nextTopics);
    setSelectedTopicId(topic.id);
    setSelectedQuestionId(question.questionId);
    setLibraryMessage('השאלה עודכנה במאגר המקומי.');
  }

  async function handleAddQuestion(event) {
    event.preventDefault();
    setLibraryError('');
    setLibraryMessage('');

    const targetTopic = topics.find((topic) => topic.id === questionTopicId) || null;

    if (!targetTopic) {
      setLibraryError('יש לבחור או ליצור נושא לפני הוספת שאלה.');
      return;
    }

    const questionText = questionForm.question.trim();
    const options = questionForm.options.map((option) => option.trim());
    const correctIndex = Number(questionForm.correctIndex);

    if (!questionText) {
      setLibraryError('יש להזין את נוסח השאלה.');
      return;
    }

    if (options.some((option) => !option)) {
      setLibraryError('יש למלא את כל ארבע אפשרויות התשובה.');
      return;
    }

    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      setLibraryError('התשובה הנכונה חייבת להיות אחת מהאפשרויות A, B, C או D.');
      return;
    }

    if (librarySource === 'server') {
      try {
        setIsBusy(true);
        const question = await addServerQuestionToTopic(targetTopic.id, {
          question: questionText,
          options,
          correctIndex,
        });
        const questionId = question.questionId || question.id;
        await refreshServerTopics(targetTopic.id, questionId);
        setQuestionForm(makeEmptyQuestionForm());
        setLibraryMessage('השאלה נוספה.');
      } catch (error) {
        setLibraryError(error.message || 'לא ניתן היה להוסיף את השאלה למסד הנתונים בשרת.');
      } finally {
        setIsBusy(false);
      }
      return;
    }

    const questionId = `${targetTopic.id}-question-${Date.now()}`;
    const question = {
      questionId,
      topicId: targetTopic.id,
      topicTitle: targetTopic.title,
      concept: inferConceptFromTopic(targetTopic),
      question: questionText,
      options,
      correctIndex,
    };

    const nextTopics = addLocalQuestionToTopic(targetTopic.id, question);
    setTopics(nextTopics);
    setSelectedTopicId(targetTopic.id);
    setQuestionTopicId(targetTopic.id);
    setSelectedQuestionId(questionId);
    setQuestionForm(makeEmptyQuestionForm());
    setLibraryMessage('השאלה נוספה.');
  }

  async function handleDeleteTopic() {
    setLibraryError('');
    setLibraryMessage('');

    const topic = topics.find((item) => item.id === deleteTopicId) || null;
    if (!topic) {
      setLibraryError('יש לבחור נושא למחיקה.');
      return;
    }

    const confirmed = window.confirm(`למחוק את הנושא "${topic.title}" ואת כל השאלות שבו? לא ניתן לבטל פעולה זו.`);
    if (!confirmed) return;

    if (librarySource === 'server') {
      try {
        setIsBusy(true);
        await deleteServerTopic(topic.id);
        const nextTopics = await refreshServerTopics('', '');
        const nextTopicId = nextTopics[0]?.id || '';
        setDeleteTopicId(nextTopicId);
        setDeleteQuestionTopicId(nextTopicId);
        setDeleteQuestionId(nextTopics[0]?.questions?.[0]?.questionId || '');
        setLibraryMessage('הנושא נמחק ממסד הנתונים בשרת.');
      } catch (error) {
        setLibraryError(error.message || 'לא ניתן היה למחוק את הנושא ממסד הנתונים בשרת.');
      } finally {
        setIsBusy(false);
      }
      return;
    }

    const nextTopics = deleteLocalTopic(topic.id);
    setTopics(nextTopics);
    const nextTopicId = nextTopics[0]?.id || '';
    setSelectedTopicId((current) => current === topic.id ? nextTopicId : current);
    setQuestionTopicId((current) => current === topic.id ? nextTopicId : current);
    setSelectedQuestionId((current) => topic.questions.some((question) => question.questionId === current) ? nextTopics[0]?.questions?.[0]?.questionId || '' : current);
    setDeleteTopicId(nextTopicId);
    setDeleteQuestionTopicId(nextTopicId);
    setDeleteQuestionId(nextTopics[0]?.questions?.[0]?.questionId || '');
    setLibraryMessage('הנושא נמחק מהמאגר המקומי.');
  }

  async function handleDeleteQuestion() {
    setLibraryError('');
    setLibraryMessage('');

    const topic = topics.find((item) => item.id === deleteQuestionTopicId) || null;
    const question = topic?.questions?.find((item) => item.questionId === deleteQuestionId) || null;

    if (!topic) {
      setLibraryError('יש לבחור נושא לפני מחיקת שאלה.');
      return;
    }

    if (!question) {
      setLibraryError('יש לבחור שאלה למחיקה.');
      return;
    }

    const confirmed = window.confirm(`למחוק את השאלה מהנושא "${topic.title}"? לא ניתן לבטל פעולה זו.`);
    if (!confirmed) return;

    if (librarySource === 'server') {
      try {
        setIsBusy(true);
        await deleteServerQuestion(topic.id, question.questionId);
        const nextTopics = await refreshServerTopics(topic.id, '');
        const refreshedTopic = nextTopics.find((item) => item.id === topic.id) || null;
        setDeleteQuestionTopicId(refreshedTopic?.id || nextTopics[0]?.id || '');
        setDeleteQuestionId(refreshedTopic?.questions?.[0]?.questionId || nextTopics[0]?.questions?.[0]?.questionId || '');
        setLibraryMessage('השאלה נמחקה ממסד הנתונים בשרת.');
      } catch (error) {
        setLibraryError(error.message || 'לא ניתן היה למחוק את השאלה ממסד הנתונים בשרת.');
      } finally {
        setIsBusy(false);
      }
      return;
    }

    const nextTopics = deleteLocalQuestionFromTopic(topic.id, question.questionId);
    setTopics(nextTopics);
    const refreshedTopic = nextTopics.find((item) => item.id === topic.id) || null;
    const nextQuestionId = refreshedTopic?.questions?.[0]?.questionId || '';
    if (selectedTopicId === topic.id && selectedQuestionId === question.questionId) {
      setSelectedQuestionId(nextQuestionId);
    }
    setDeleteQuestionTopicId(topic.id);
    setDeleteQuestionId(nextQuestionId);
    setLibraryMessage('השאלה נמחקה מהמאגר המקומי.');
  }

  function findNextQuestionInTopic(topicId, currentQuestionId) {
    if (!topicId || !currentQuestionId) return null;

    const topic = topics.find((item) => item.id === topicId);
    if (!topic || !Array.isArray(topic.questions)) return null;

    const currentIndex = topic.questions.findIndex((question) => question.questionId === currentQuestionId);
    if (currentIndex < 0) return null;

    return topic.questions[currentIndex + 1] || null;
  }

  function openQuizForQuestion(question, topic, statusMessage = 'פותח בוחן חי...') {
    if (!joinCode || !socket.connected) {
      setError('יש להתחיל מפגש חי לפני פתיחת בוחן.');
      return;
    }

    if (!topic) {
      setError('יש לבחור תחילה נושא לבוחן.');
      return;
    }

    if (!question) {
      setError('יש לבחור תחילה שאלה.');
      return;
    }

    const quiz = makeLiveQuiz({
      ...question,
      topicId: topic.id,
      topicTitle: topic.title,
    });

    setIsBusy(true);
    setError('');
    setStatus(statusMessage);
    setAnswerRevealed(false);
    setQuizResults(emptyResultsFor(quiz));

    socket.emit('lecturer:open-quiz', { joinCode, quiz }, (response) => {
      setIsBusy(false);
      if (!response?.success) {
        setError(response?.error || 'לא ניתן היה לפתוח את הבוחן החי.');
        setStatus('');
        return;
      }

      const openedQuiz = response.activeQuiz || quiz;
      setLiveQuiz(openedQuiz);
      setAnswerRevealed(openedQuiz.answerRevealed === true);
      setQuizResults(response.results || emptyResultsFor(openedQuiz));
      setStatus('הבוחן החי פתוח. תשובות הסטודנטים יתעדכנו כאן.');
    });
  }

  async function openLiveQuiz() {
    openQuizForQuestion(selectedQuestion, selectedTopic);
  }

  function openNextQuestion() {
    if (!liveQuiz || !answerRevealed) return;

    const topicId = liveQuiz.topicId || selectedTopicId;
    const currentQuestionId = getLibraryQuestionId(liveQuiz);
    const nextQuestion = findNextQuestionInTopic(topicId, currentQuestionId);
    const topic = topics.find((item) => item.id === topicId) || selectedTopic;

    if (!nextQuestion || !topic) {
      setStatus('אין שאלות נוספות בנושא זה.');
      return;
    }

    setSelectedTopicId(topic.id);
    setSelectedQuestionId(nextQuestion.questionId);
    openQuizForQuestion(nextQuestion, topic, 'פותח את השאלה הבאה...');
  }

  async function revealAnswer() {
    if (!joinCode || !socket.connected || !liveQuiz || answerRevealed) return;

    setIsBusy(true);
    setError('');
    socket.emit('lecturer:reveal-answer', { joinCode }, (response) => {
      setIsBusy(false);
      if (!response?.success) {
        setError(response?.error || 'לא ניתן היה לחשוף את התשובה.');
        return;
      }

      setAnswerRevealed(true);
      setLiveQuiz((currentQuiz) => currentQuiz ? {
        ...currentQuiz,
        answerRevealed: true,
        correctIndex: Number.isInteger(response.correctIndex) ? response.correctIndex : currentQuiz.correctIndex,
      } : currentQuiz);
      if (response.results) setQuizResults(response.results);
      setStatus('התשובה נחשפה לכיתה.');
    });
  }

  async function closeLiveQuiz() {
    if (!joinCode || !socket.connected) return;

    setIsBusy(true);
    setError('');
    socket.emit('lecturer:close-quiz', { joinCode }, (response) => {
      setIsBusy(false);
      if (!response?.success) {
        setError(response?.error || 'לא ניתן היה לסגור את הבוחן.');
        return;
      }

      setLiveQuiz(null);
      setQuizResults(null);
      setAnswerRevealed(false);
      setStatus('הבוחן החי נסגר.');
    });
  }

  const shownQuiz = liveQuiz || selectedQuestion;
  const results = quizResults || emptyResultsFor(shownQuiz);
  const maxCount = Math.max(1, ...results.distribution);
  const waitingCount = liveQuiz ? (results.studentStatuses || []).filter((student) => !student.hasAnswered).length : 0;
  const canOpenQuiz = Boolean(joinCode && selectedTopic && selectedQuestion && !isBusy);
  const selectedTopicQuestions = selectedTopic?.questions || [];
  const nextQuestion = liveQuiz && answerRevealed
    ? findNextQuestionInTopic(liveQuiz.topicId || selectedTopicId, getLibraryQuestionId(liveQuiz))
    : null;
  const hasNextQuestion = Boolean(nextQuestion);
  const selectedQuestionIsDifferentFromLiveQuiz = Boolean(
    liveQuiz
    && selectedQuestion
    && getLibraryQuestionId(liveQuiz)
    && getLibraryQuestionId(liveQuiz) !== selectedQuestion.questionId,
  );

  return (
    <section className="card quiz-card live-quiz-card">
      <div className="quiz-left">
        <div className="section-title">
          בדיקת הבנה חיה <span className={joinCode ? 'badge-sim' : 'badge-soon'}>{joinCode ? 'מחובר' : 'נדרש מפגש'}</span>
        </div>

        <div className="quiz-topic-panel">
          <div className="section-title small-title">נושאי הבוחן</div>
          <div className="quiz-selector-grid">
            <label className="field-group">
              <span>בחירת נושא לבוחן</span>
              <select value={selectedTopicId} onChange={(event) => handleSelectTopic(event.target.value)}>
                {topics.length === 0 && <option value="">אין נושאים זמינים</option>}
                {topics.map((topic) => (
                  <option value={topic.id} key={topic.id}>{topic.title}</option>
                ))}
              </select>
            </label>

            <label className="field-group">
              <span>בחירת שאלה</span>
              <select
                value={selectedQuestionId}
                onChange={(event) => setSelectedQuestionId(event.target.value)}
                disabled={!selectedTopic || selectedTopicQuestions.length === 0}
              >
                {!selectedTopic && <option value="">בחרו תחילה נושא</option>}
                {selectedTopic && selectedTopicQuestions.length === 0 && <option value="">אין שאלות בנושא זה</option>}
                {selectedTopicQuestions.map((question) => (
                  <option value={question.questionId} key={question.questionId}>{question.question}</option>
                ))}
              </select>
            </label>
          </div>

          {!selectedTopic && (
            <div className="empty-table-note">אין נושאים זמינים.</div>
          )}
        </div>

        {liveQuiz && (
          <div className="active-quiz-summary">
            <span className="status-badge answered">בוחן פעיל</span>
            <span>{results.totalResponses} ענו</span>
            <span>{waitingCount} ממתינים</span>
            <span>{answerRevealed ? 'התשובה נחשפה' : 'התשובה מוסתרת'}</span>
          </div>
        )}

        {shownQuiz ? (
          <>
            {shownQuiz.topicTitle && <div className="quiz-topic-label">נושא: {shownQuiz.topicTitle}</div>}
            <div className="quiz-q"><LatexText text={shownQuiz.question} /></div>
            <div className="quiz-opts">
              {shownQuiz.options.map((option, index) => {
                const isCorrectAfterReveal = liveQuiz && answerRevealed && index === shownQuiz.correctIndex;
                return (
                  <div key={`${shownQuiz.questionId}-${option}`} className={`quiz-opt ${isCorrectAfterReveal ? 'correct-soft' : ''}`}>
                    <span className="letter">{String.fromCharCode(65 + index)}</span>
                    <span><LatexText text={option} /></span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="message-box info-message">עדיין אין שאלות בנושא זה. הוסיפו שאלה כדי להתחיל בוחן חי.</div>
        )}

        <div className="quiz-feedback">
          {!joinCode && 'יש להתחיל מפגש חי כדי לשלוח שאלה לסטודנטים.'}
          {joinCode && !selectedTopic && 'יש לבחור תחילה נושא לבוחן.'}
          {joinCode && selectedTopic && !selectedQuestion && 'יש לבחור תחילה שאלה.'}
          {joinCode && selectedTopic && selectedQuestion && !liveQuiz && 'פתחו את הבוחן החי כדי לשדר לסטודנטים את השאלה שנבחרה.'}
          {liveQuiz && selectedQuestionIsDifferentFromLiveQuiz && !isBusy && 'נבחרה שאלה אחרת. לחצו על "עדכון הבוחן החי" כדי לשדר אותה לסטודנטים.'}
          {liveQuiz && !selectedQuestionIsDifferentFromLiveQuiz && status}
        </div>
        {error && <div className="form-error">{error}</div>}

        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn primary" type="button" onClick={openLiveQuiz} disabled={!canOpenQuiz}>
            {liveQuiz ? 'עדכון הבוחן החי' : 'פתיחת בוחן חי'}
          </button>
          <button
            className={`btn ${liveQuiz && !answerRevealed && !isBusy ? 'primary live-quiz-action-button' : ''}`}
            type="button"
            onClick={revealAnswer}
            disabled={!liveQuiz || answerRevealed || isBusy}
          >
            חשיפת תשובה
          </button>
          {liveQuiz && answerRevealed && hasNextQuestion && (
            <button
              className="btn primary live-quiz-action-button"
              type="button"
              onClick={openNextQuestion}
              disabled={isBusy}
            >
              לשאלה הבאה
            </button>
          )}
          <button
            className={`btn ${liveQuiz && !isBusy ? 'primary live-quiz-action-button' : ''}`}
            type="button"
            onClick={closeLiveQuiz}
            disabled={!liveQuiz || isBusy}
          >
            סגירת הבוחן
          </button>
        </div>
        {liveQuiz && answerRevealed && !hasNextQuestion && (
          <div className="quiz-feedback next-question-note">אין שאלות נוספות בנושא זה.</div>
        )}

        <details className="quiz-management" open={false}>
          <summary>ניהול נושאים ושאלות</summary>
          <div className="quiz-library-status">
            {libraryLoading ? 'טוען את מאגר השאלות...' : `מאגר שאלות: ${librarySource === 'server' ? 'מסד נתונים בשרת' : 'מאגר מקומי'}`}
          </div>
          <div className="quiz-management-grid">
            <form className="quiz-builder-form" onSubmit={handleAddTopic}>
              <div className="section-title small-title">הוספת נושא חדש</div>
              <label className="field-group">
                <span>כותרת הנושא</span>
                <input
                  type="text"
                  value={topicForm.title}
                  onChange={(event) => setTopicForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="לדוגמה: אורתוגונליות"
                />
              </label>
              <button className="btn primary" type="submit" disabled={isBusy || libraryLoading}>הוספת נושא</button>
            </form>

            <form className="quiz-builder-form" onSubmit={handleAddQuestion}>
              <div className="section-title small-title">הוספת שאלה לנושא</div>
              <label className="field-group">
                <span>הוספת שאלה תחת הנושא</span>
                <select
                  value={questionTopicId}
                  onChange={(event) => setQuestionTopicId(event.target.value)}
                  disabled={topics.length === 0}
                >
                  {topics.length === 0 && <option value="">אין נושאים זמינים</option>}
                  {topics.map((topic) => (
                    <option value={topic.id} key={`add-question-topic-${topic.id}`}>{topic.title}</option>
                  ))}
                </select>
              </label>
              {!questionTopicId && (
                <div className="message-box info-message">בחרו או צרו נושא לפני הוספת שאלה.</div>
              )}
              {questionTopicId && (
                <div className="quiz-feedback">הוספה אל: {topics.find((topic) => topic.id === questionTopicId)?.title || 'הנושא שנבחר'}</div>
              )}
              <label className="field-group">
                <span>נוסח השאלה</span>
                <textarea
                  value={questionForm.question}
                  onChange={(event) => setQuestionForm((current) => ({ ...current, question: event.target.value }))}
                  placeholder="לדוגמה: האם $v=(1,0)$ הוא וקטור עצמי של $A$?"
                  rows="3"
                />
                <small className="latex-help-text">ניתן להשתמש ב־LaTeX: בתוך שורה <code>$...$</code> או בתצוגה נפרדת <code>$$...$$</code>.</small>
              </label>
              {questionForm.question.trim() && (
                <div className="latex-preview-box">
                  <div className="latex-preview-title">תצוגה מקדימה של השאלה</div>
                  <LatexText text={questionForm.question} />
                </div>
              )}
              <div className="option-editor-grid">
                {questionForm.options.map((option, index) => (
                  <label className="field-group" key={`option-${index}`}>
                    <span>אפשרות {String.fromCharCode(65 + index)}</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(event) => handleQuestionOptionChange(index, event.target.value)}
                      placeholder={`תשובה ${String.fromCharCode(65 + index)} · ניתן להשתמש ב־$...$`}
                    />
                  </label>
                ))}
              </div>
              {questionForm.options.some((option) => option.trim()) && (
                <div className="latex-preview-box">
                  <div className="latex-preview-title">תצוגה מקדימה של האפשרויות</div>
                  <div className="latex-preview-options">
                    {questionForm.options.map((option, index) => (
                      <div key={`preview-option-${index}`}>
                        <strong>{String.fromCharCode(65 + index)}.</strong> <LatexText text={option || '—'} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="quiz-selector-grid">
                <label className="field-group">
                  <span>תשובה נכונה</span>
                  <select
                    value={questionForm.correctIndex}
                    onChange={(event) => setQuestionForm((current) => ({ ...current, correctIndex: Number(event.target.value) }))}
                  >
                    <option value={0}>אפשרות A</option>
                    <option value={1}>אפשרות B</option>
                    <option value={2}>אפשרות C</option>
                    <option value={3}>אפשרות D</option>
                  </select>
                </label>
              </div>
              <div className="quiz-feedback">
                המושג המתאים נבחר אוטומטית לפי הנושא.
              </div>
              <button className="btn primary" type="submit" disabled={!questionTopicId || isBusy || libraryLoading}>הוספת שאלה</button>
            </form>
          </div>

          <div className="quiz-management-grid quiz-edit-management">
            <form className="quiz-builder-form" onSubmit={handleEditTopic}>
              <div className="section-title small-title">עריכת נושא קיים</div>
              <label className="field-group">
                <span>נושא לעריכה</span>
                <select
                  value={editTopicId}
                  onChange={(event) => {
                    const topicId = event.target.value;
                    const topic = topics.find((item) => item.id === topicId);
                    setEditTopicId(topicId);
                    setEditTopicForm({ title: topic?.title || '' });
                  }}
                  disabled={topics.length === 0 || isBusy || libraryLoading}
                >
                  {topics.length === 0 && <option value="">אין נושאים זמינים</option>}
                  {topics.map((topic) => (
                    <option value={topic.id} key={`edit-topic-${topic.id}`}>{topic.title}</option>
                  ))}
                </select>
              </label>
              <label className="field-group">
                <span>כותרת חדשה לנושא</span>
                <input
                  type="text"
                  value={editTopicForm.title}
                  onChange={(event) => setEditTopicForm({ title: event.target.value })}
                  placeholder="כותרת מעודכנת לנושא"
                  disabled={!editTopicId || isBusy || libraryLoading}
                />
              </label>
              <button className="btn primary" type="submit" disabled={!editTopicId || isBusy || libraryLoading}>שמירת השינויים בנושא</button>
            </form>

            <form className="quiz-builder-form" onSubmit={handleEditQuestion}>
              <div className="section-title small-title">עריכת שאלה קיימת</div>
              <label className="field-group">
                <span>נושא</span>
                <select
                  value={editQuestionTopicId}
                  onChange={(event) => {
                    const topicId = event.target.value;
                    const topic = topics.find((item) => item.id === topicId);
                    setEditQuestionTopicId(topicId);
                    setEditQuestionId(topic?.questions?.[0]?.questionId || '');
                  }}
                  disabled={topics.length === 0 || isBusy || libraryLoading}
                >
                  {topics.length === 0 && <option value="">אין נושאים זמינים</option>}
                  {topics.map((topic) => (
                    <option value={topic.id} key={`edit-question-topic-${topic.id}`}>{topic.title}</option>
                  ))}
                </select>
              </label>
              <label className="field-group">
                <span>שאלה לעריכה</span>
                <select
                  value={editQuestionId}
                  onChange={(event) => setEditQuestionId(event.target.value)}
                  disabled={!editQuestionTopicId || isBusy || libraryLoading}
                >
                  {(topics.find((topic) => topic.id === editQuestionTopicId)?.questions || []).length === 0 && <option value="">אין שאלות זמינות</option>}
                  {(topics.find((topic) => topic.id === editQuestionTopicId)?.questions || []).map((question, index) => (
                    <option value={question.questionId} key={`edit-question-${question.questionId}`}>{index + 1}. {question.question}</option>
                  ))}
                </select>
              </label>
              <label className="field-group">
                <span>נוסח השאלה</span>
                <textarea
                  value={editQuestionForm.question}
                  onChange={(event) => setEditQuestionForm((current) => ({ ...current, question: event.target.value }))}
                  placeholder="עריכת נוסח השאלה · ניתן להשתמש ב־$...$"
                  rows="3"
                  disabled={!editQuestionId || isBusy || libraryLoading}
                />
                <small className="latex-help-text">ניתן להשתמש ב־LaTeX: בתוך שורה <code>$...$</code> או בתצוגה נפרדת <code>$$...$$</code>.</small>
              </label>
              {editQuestionForm.question.trim() && (
                <div className="latex-preview-box">
                  <div className="latex-preview-title">תצוגה מקדימה של השאלה הערוכה</div>
                  <LatexText text={editQuestionForm.question} />
                </div>
              )}
              <div className="option-editor-grid">
                {editQuestionForm.options.map((option, index) => (
                  <label className="field-group" key={`edit-option-${index}`}>
                    <span>אפשרות {String.fromCharCode(65 + index)}</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(event) => handleEditQuestionOptionChange(index, event.target.value)}
                      placeholder={`תשובה ${String.fromCharCode(65 + index)} · ניתן להשתמש ב־$...$`}
                      disabled={!editQuestionId || isBusy || libraryLoading}
                    />
                  </label>
                ))}
              </div>
              {editQuestionForm.options.some((option) => option.trim()) && (
                <div className="latex-preview-box">
                  <div className="latex-preview-title">תצוגה מקדימה של האפשרויות הערוכות</div>
                  <div className="latex-preview-options">
                    {editQuestionForm.options.map((option, index) => (
                      <div key={`edit-preview-option-${index}`}>
                        <strong>{String.fromCharCode(65 + index)}.</strong> <LatexText text={option || '—'} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="quiz-selector-grid">
                <label className="field-group">
                  <span>תשובה נכונה</span>
                  <select
                    value={editQuestionForm.correctIndex}
                    onChange={(event) => setEditQuestionForm((current) => ({ ...current, correctIndex: Number(event.target.value) }))}
                    disabled={!editQuestionId || isBusy || libraryLoading}
                  >
                    <option value={0}>אפשרות A</option>
                    <option value={1}>אפשרות B</option>
                    <option value={2}>אפשרות C</option>
                    <option value={3}>אפשרות D</option>
                  </select>
                </label>
              </div>
              <button className="btn primary" type="submit" disabled={!editQuestionId || isBusy || libraryLoading}>שמירת השינויים בשאלה</button>
            </form>
          </div>

          <div className="quiz-delete-management">
            <form className="quiz-builder-form delete-builder-form" onSubmit={(event) => { event.preventDefault(); handleDeleteTopic(); }}>
              <div className="section-title small-title">מחיקת נושא</div>
              <label className="field-group">
                <span>נושא למחיקה</span>
                <select
                  value={deleteTopicId}
                  onChange={(event) => setDeleteTopicId(event.target.value)}
                  disabled={topics.length === 0 || isBusy || libraryLoading}
                >
                  {topics.length === 0 && <option value="">אין נושאים זמינים</option>}
                  {topics.map((topic) => (
                    <option value={topic.id} key={`delete-topic-${topic.id}`}>{topic.title}</option>
                  ))}
                </select>
              </label>
              <button className="btn danger-btn" type="submit" disabled={!deleteTopicId || isBusy || libraryLoading}>מחיקת נושא</button>
              <div className="quiz-feedback">מחיקת נושא מוחקת גם את כל השאלות שבתוכו.</div>
            </form>

            <form className="quiz-builder-form delete-builder-form" onSubmit={(event) => { event.preventDefault(); handleDeleteQuestion(); }}>
              <div className="section-title small-title">מחיקת שאלה</div>
              <label className="field-group">
                <span>נושא</span>
                <select
                  value={deleteQuestionTopicId}
                  onChange={(event) => {
                    const topicId = event.target.value;
                    const topic = topics.find((item) => item.id === topicId);
                    setDeleteQuestionTopicId(topicId);
                    setDeleteQuestionId(topic?.questions?.[0]?.questionId || '');
                  }}
                  disabled={topics.length === 0 || isBusy || libraryLoading}
                >
                  {topics.length === 0 && <option value="">אין נושאים זמינים</option>}
                  {topics.map((topic) => (
                    <option value={topic.id} key={`delete-question-topic-${topic.id}`}>{topic.title}</option>
                  ))}
                </select>
              </label>
              <label className="field-group">
                <span>שאלה למחיקה</span>
                <select
                  value={deleteQuestionId}
                  onChange={(event) => setDeleteQuestionId(event.target.value)}
                  disabled={!deleteQuestionTopicId || isBusy || libraryLoading}
                >
                  {(topics.find((topic) => topic.id === deleteQuestionTopicId)?.questions || []).length === 0 && <option value="">אין שאלות זמינות</option>}
                  {(topics.find((topic) => topic.id === deleteQuestionTopicId)?.questions || []).map((question, index) => (
                    <option value={question.questionId} key={`delete-question-${question.questionId}`}>{index + 1}. {question.question}</option>
                  ))}
                </select>
              </label>
              <button className="btn danger-btn" type="submit" disabled={!deleteQuestionId || isBusy || libraryLoading}>מחיקת שאלה</button>
              <div className="quiz-feedback">פעולה זו מוחקת רק את השאלה שנבחרה.</div>
            </form>
          </div>
          {libraryMessage && <div className="message-box success-message">{libraryMessage}</div>}
          {libraryError && <div className="message-box error-message">{libraryError}</div>}
        </details>
      </div>

      <div className="quiz-right">
        <div className="section-title">תוצאות בזמן אמת <span className="badge-sim">בזיכרון זמני</span></div>
        <div className="class-stats">
          <div className="connected-row">
            <span className="dot-pulse"></span>
            <span><span className="num">{results.totalResponses}</span> תשובות</span>
          </div>
          {answerRevealed ? (
            <div className="bar-row">
              <div className="top"><span>תשובות נכונות</span><b>{results.correctPct}%</b></div>
              <div className="bar"><span style={{ width: `${results.correctPct}%` }}></span></div>
            </div>
          ) : (
            <div className="quiz-feedback">אחוז התשובות הנכונות מוסתר עד לחשיפת התשובה.</div>
          )}
          {shownQuiz ? shownQuiz.options.map((option, index) => {
            const count = results.distribution[index] || 0;
            const width = `${Math.round((count / maxCount) * 100)}%`;
            const letter = String.fromCharCode(65 + index);
            const isCorrectAfterReveal = answerRevealed && index === shownQuiz.correctIndex;
            return (
              <div className={`bar-row ${isCorrectAfterReveal ? 'correct-result-row' : ''}`} key={`result-${shownQuiz.questionId}-${index}`}>
                <div className="top"><span>{letter} - <LatexText text={option} /></span><b>{count}</b></div>
                <div className="bar"><span style={{ width }}></span></div>
              </div>
            );
          }) : (
            <div className="empty-table-note">עדיין לא נבחרה שאלה.</div>
          )}
          <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 4 }}>
            התוצאות נשמרות בזיכרון זמני ומתאפסות כאשר החדר נסגר או השרת מופעל מחדש.
          </div>
        </div>

        {liveQuiz && (
          <StudentAnswersPanel results={results} quiz={shownQuiz} answerRevealed={answerRevealed} />
        )}
      </div>
    </section>
  );
}
