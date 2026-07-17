import { useEffect, useMemo, useState } from 'react';
import { fetchQuizTopics } from '../api/quizLibraryApi.js';
import { loadQuizTopics } from '../utils/quizStorage.js';
import LatexText from './LatexText.jsx';

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

function normalizeQuestion(question, topic) {
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

function normalizeTopics(value) {
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
      ? topic.questions.map((question) => normalizeQuestion(question, safeTopic))
      : [];

    return safeTopic;
  }).filter((topic) => topic.id && topic.title);
}

function answerLetter(index) {
  return Number.isInteger(index) ? String.fromCharCode(65 + index) : '—';
}

export default function PracticeQuiz() {
  const [topics, setTopics] = useState(() => normalizeTopics(loadQuizTopics()));
  const [librarySource, setLibrarySource] = useState('local');
  const [isLoading, setIsLoading] = useState(true);
  const [libraryMessage, setLibraryMessage] = useState('טוען את מאגר השאלות...');
  const [selectedTopicId, setSelectedTopicId] = useState(() => normalizeTopics(loadQuizTopics())[0]?.id || '');
  const [selectedQuestionId, setSelectedQuestionId] = useState(() => normalizeTopics(loadQuizTopics())[0]?.questions?.[0]?.questionId || '');
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLibrary() {
      setIsLoading(true);
      setLibraryMessage('טוען את מאגר השאלות...');

      try {
        const serverTopics = normalizeTopics(await fetchQuizTopics());
        if (!isMounted) return;

        if (serverTopics.length === 0) {
          throw new Error('מאגר השאלות בשרת לא החזיר נושאים.');
        }

        setTopics(serverTopics);
        setLibrarySource('server');
        setLibraryMessage('מאגר שאלות: מסד הנתונים בשרת');
        setSelectedTopicId((current) => current && serverTopics.some((topic) => topic.id === current) ? current : serverTopics[0]?.id || '');
        setSelectedQuestionId((current) => {
          if (serverTopics.some((topic) => topic.questions.some((question) => question.questionId === current))) return current;
          return serverTopics[0]?.questions?.[0]?.questionId || '';
        });
      } catch (error) {
        if (!isMounted) return;

        const localTopics = normalizeTopics(loadQuizTopics());
        setTopics(localTopics);
        setLibrarySource('local');
        setLibraryMessage('נעשה שימוש במאגר שאלות מקומי משום שמאגר השרת אינו זמין.');
        setSelectedTopicId((current) => current && localTopics.some((topic) => topic.id === current) ? current : localTopics[0]?.id || '');
        setSelectedQuestionId((current) => {
          if (localTopics.some((topic) => topic.questions.some((question) => question.questionId === current))) return current;
          return localTopics[0]?.questions?.[0]?.questionId || '';
        });
        console.warn('Practice quiz library fallback:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadLibrary();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) || null,
    [topics, selectedTopicId],
  );

  const selectedQuestion = useMemo(
    () => selectedTopic?.questions?.find((question) => question.questionId === selectedQuestionId) || null,
    [selectedTopic, selectedQuestionId],
  );

  useEffect(() => {
    if (!selectedTopic && topics[0]) {
      setSelectedTopicId(topics[0].id);
      setSelectedQuestionId(topics[0].questions?.[0]?.questionId || '');
      return;
    }

    if (selectedTopic && !selectedTopic.questions.some((question) => question.questionId === selectedQuestionId)) {
      setSelectedQuestionId(selectedTopic.questions?.[0]?.questionId || '');
    }
  }, [topics, selectedTopic, selectedQuestionId]);

  useEffect(() => {
    setSelectedChoice(null);
    setChecked(false);
  }, [selectedQuestionId]);

  function handleTopicChange(topicId) {
    const nextTopic = topics.find((topic) => topic.id === topicId) || null;
    setSelectedTopicId(topicId);
    setSelectedQuestionId(nextTopic?.questions?.[0]?.questionId || '');
    setSelectedChoice(null);
    setChecked(false);
  }

  function handleQuestionChange(questionId) {
    setSelectedQuestionId(questionId);
    setSelectedChoice(null);
    setChecked(false);
  }

  function checkAnswer() {
    if (selectedChoice === null) return;
    setChecked(true);
  }

  function goToNextQuestion() {
    if (!selectedTopic || !selectedQuestion) return;

    const currentIndex = selectedTopic.questions.findIndex((question) => question.questionId === selectedQuestion.questionId);
    const nextQuestion = selectedTopic.questions[currentIndex + 1] || selectedTopic.questions[0] || null;

    if (nextQuestion) {
      setSelectedQuestionId(nextQuestion.questionId);
      setSelectedChoice(null);
      setChecked(false);
    }
  }

  const canCheck = selectedQuestion && selectedChoice !== null && !checked;
  const isCorrect = checked && selectedChoice === selectedQuestion?.correctIndex;
  const hasNextQuestion = selectedTopic && selectedTopic.questions.length > 1;

  return (
    <section className="card practice-quiz-card">
      <div className="card-section">
        <div className="section-title">תרגול עצמי</div>
        <p className="practice-note">בחרו נושא וענו על שאלות באופן עצמאי. התשובות אינן נשלחות לשיעור חי.</p>
        <div className={`quiz-library-status ${librarySource === 'server' ? 'server-source' : 'local-source'}`}>
          {libraryMessage}
        </div>

        {isLoading ? (
          <div className="message-box loading-message">טוען את מאגר השאלות...</div>
        ) : topics.length === 0 ? (
          <div className="message-box warning-message">אין כרגע נושאי תרגול זמינים.</div>
        ) : (
          <>
            <div className="quiz-selector-grid practice-selector-grid">
              <label className="field-group">
                בחירת נושא
                <select value={selectedTopicId} onChange={(e) => handleTopicChange(e.target.value)}>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>{topic.title}</option>
                  ))}
                </select>
              </label>

              <label className="field-group">
                בחירת שאלה
                <select value={selectedQuestionId} onChange={(e) => handleQuestionChange(e.target.value)} disabled={!selectedTopic?.questions?.length}>
                  {(selectedTopic?.questions || []).map((question, index) => (
                    <option key={question.questionId} value={question.questionId}>שאלה {index + 1}</option>
                  ))}
                </select>
              </label>
            </div>

            {!selectedQuestion ? (
              <div className="message-box warning-message">עדיין אין שאלות בנושא זה.</div>
            ) : (
              <div className="practice-question-panel">
                {selectedQuestion.topicTitle && <div className="quiz-topic-label">נושא: {selectedQuestion.topicTitle}</div>}
                <div className="quiz-q"><LatexText text={selectedQuestion.question} /></div>
                <div className="quiz-opts">
                  {selectedQuestion.options.map((option, index) => {
                    const isSelected = selectedChoice === index;
                    const isCorrectOption = checked && index === selectedQuestion.correctIndex;
                    const isWrongSelection = checked && isSelected && index !== selectedQuestion.correctIndex;
                    const cls = ['quiz-opt'];
                    if (isSelected) cls.push('selected');
                    if (isCorrectOption) cls.push('correct');
                    if (isWrongSelection) cls.push('wrong');

                    return (
                      <button
                        key={`${selectedQuestion.questionId}-${index}`}
                        className={cls.join(' ')}
                        type="button"
                        onClick={() => {
                          if (checked) return;
                          setSelectedChoice(index);
                        }}
                        disabled={checked}
                      >
                        <span className="letter">{answerLetter(index)}</span>
                        <span><LatexText text={option} /></span>
                      </button>
                    );
                  })}
                </div>

                <div className="practice-quiz-actions">
                  <button className="btn primary" type="button" onClick={checkAnswer} disabled={!canCheck}>בדיקת תשובה</button>
                  {hasNextQuestion && <button className="btn" type="button" onClick={goToNextQuestion}>לשאלה הבאה</button>}
                </div>

                <div className="quiz-feedback">
                  {!checked && selectedChoice === null && 'בחרו תשובה אחת.'}
                  {!checked && selectedChoice !== null && `הבחירה הנוכחית: ${answerLetter(selectedChoice)}. לחצו על "בדיקת תשובה" כשתהיו מוכנים.`}
                  {checked && isCorrect && '✓ תשובה נכונה.'}
                  {checked && !isCorrect && (
                    <span>
                      ✗ תשובה שגויה. התשובה הנכונה: {answerLetter(selectedQuestion.correctIndex)} - <LatexText text={selectedQuestion.options[selectedQuestion.correctIndex]} />
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
