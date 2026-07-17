import { useEffect, useState } from 'react';
import { socket } from '../api/socketClient.js';
import LatexText from './LatexText.jsx';

export default function StudentLiveQuiz({ joinCode, quiz, results, answerReveal, onAnswered }) {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [feedback, setFeedback] = useState('בחרו תשובה אחת.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedChoice(null);
    setFeedback('בחרו תשובה אחת.');
    setIsSubmitting(false);
    setError('');
  }, [quiz?.questionId]);

  useEffect(() => {
    if (!quiz || selectedChoice === null) return;

    if (answerReveal?.answerRevealed && answerReveal.questionId === quiz.questionId) {
      const isCorrect = selectedChoice === answerReveal.correctIndex;
      setFeedback(isCorrect ? '✓ תשובה נכונה.' : `✗ לא מדויק. התשובה הנכונה: ${String.fromCharCode(65 + answerReveal.correctIndex)}.`);
    }
  }, [answerReveal, quiz, selectedChoice]);

  if (!quiz) {
    return (
      <section className="card student-live-quiz-card">
        <div className="card-section">
          <div className="section-title">בוחן חי</div>
          <div className="message-box info-message">אין כרגע בוחן פעיל. כאשר המרצה יפתח שאלה, היא תופיע כאן.</div>
        </div>
      </section>
    );
  }

  const answerRevealed = quiz.answerRevealed === true || (answerReveal?.answerRevealed === true && answerReveal.questionId === quiz.questionId);
  const revealedCorrectIndex = answerRevealed
    ? (Number.isInteger(answerReveal?.correctIndex) ? answerReveal.correctIndex : quiz.correctIndex)
    : null;

  function submitAnswer(choiceIndex) {
    if (answerRevealed || isSubmitting) return;

    const previousChoice = selectedChoice;
    setSelectedChoice(choiceIndex);
    setIsSubmitting(true);
    setError('');

    socket.emit('student:quiz-response', {
      joinCode,
      questionId: quiz.questionId,
      choiceIndex,
    }, (response) => {
      setIsSubmitting(false);
      if (!response?.success) {
        setError(response?.error || 'לא ניתן היה לשלוח את התשובה.');
        setFeedback(previousChoice === null ? 'נסו שוב בעוד רגע.' : 'לא ניתן היה לעדכן את התשובה. הבחירה הקודמת עדיין מסומנת.');
        setSelectedChoice(previousChoice);
        return;
      }

      if (response.answerRevealed && Number.isInteger(response.correctIndex)) {
        const correct = response.correct === true;
        setFeedback(correct ? '✓ תשובה נכונה.' : `✗ לא מדויק. התשובה הנכונה: ${String.fromCharCode(65 + response.correctIndex)}.`);
      } else {
        setFeedback('התשובה נשלחה. ניתן לשנות אותה עד שהמרצה יחשוף את התשובה הנכונה.');
      }

      onAnswered?.(choiceIndex, response);
    });
  }

  const maxCount = Math.max(1, ...(results?.distribution || []));

  return (
    <section className="card student-live-quiz-card">
      <div className="card-section">
        <div className="section-title">בוחן חי <span className="badge-sim">מהמרצה</span></div>
        {quiz.topicTitle && <div className="quiz-topic-label">נושא: {quiz.topicTitle}</div>}
        <div className="quiz-q"><LatexText text={quiz.question} /></div>
        <div className="quiz-opts">
          {quiz.options.map((option, index) => {
            const isSelected = selectedChoice === index;
            const showCorrect = answerRevealed && index === revealedCorrectIndex;
            const showWrong = answerRevealed && isSelected && index !== revealedCorrectIndex;
            const cls = ['quiz-opt'];
            if (showCorrect) cls.push('correct');
            if (showWrong) cls.push('wrong');
            if (isSelected) cls.push('selected');
            return (
              <button
                key={`${quiz.questionId}-${option}`}
                className={cls.join(' ')}
                type="button"
                onClick={() => submitAnswer(index)}
                disabled={answerRevealed || isSubmitting}
              >
                <span className="letter">{String.fromCharCode(65 + index)}</span>
                <span><LatexText text={option} /></span>
              </button>
            );
          })}
        </div>
        <div className="quiz-feedback">
          {isSubmitting ? 'שולח...' : feedback}
        </div>
        {selectedChoice !== null && !answerRevealed && !isSubmitting && (
          <div className="quiz-feedback quiz-change-hint">
            הבחירה הנוכחית: {String.fromCharCode(65 + selectedChoice)}. לחצו על אפשרות אחרת כדי לשנות אותה.
          </div>
        )}
        {answerRevealed && (
          <div className="quiz-feedback quiz-change-hint">
            התשובה נחשפה ולכן לא ניתן עוד לשנות את הבחירה.
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
      </div>

      {results && (
        <div className="card-section">
          <div className="section-title">תוצאות הכיתה</div>
          <div className="class-stats">
            <div className="connected-row">
              <span className="dot-pulse"></span>
              <span><span className="num">{results.totalResponses}</span> תשובות</span>
            </div>
            {answerRevealed && (
              <div className="quiz-feedback">שיעור התשובות הנכונות בכיתה: {results.correctPct}%</div>
            )}
            {quiz.options.map((option, index) => {
              const count = results.distribution[index] || 0;
              const width = `${Math.round((count / maxCount) * 100)}%`;
              const isCorrectAfterReveal = answerRevealed && index === revealedCorrectIndex;
              return (
                <div className={`bar-row ${isCorrectAfterReveal ? 'correct-result-row' : ''}`} key={`student-result-${quiz.questionId}-${index}`}>
                  <div className="top"><span>{String.fromCharCode(65 + index)} - <LatexText text={option} /></span><b>{count}</b></div>
                  <div className="bar"><span style={{ width }}></span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
