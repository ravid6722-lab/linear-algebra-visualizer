export const DEFAULT_QUIZ_TOPICS = [
  {
    id: 'transformations',
    title: 'טרנספורמציות לינאריות',
    description: 'שאלות על טרנספורמציות מטריציוניות ועל המשמעות הגיאומטרית שלהן.',
    questions: [
      {
        questionId: 'transformations-origin', topicId: 'transformations', topicTitle: 'טרנספורמציות לינאריות', concept: 'transformation',
        question: 'מפעילים מטריצה בגודל 2×2 על כל וקטור במישור. איזו נקודה נשארת קבועה?',
        options: ['כל האורכים והזוויות', 'ראשית הצירים', 'כל הישרים האופקיים', 'ערך הדטרמיננטה'], correctIndex: 1,
        explanations: [
          'רק טרנספורמציות מיוחדות, כגון סיבוב ושיקוף, שומרות על אורכים וזוויות.',
          'נכון. כל טרנספורמציה לינארית משאירה את הראשית במקום, משום ש־A·0 = 0.',
          'רוב הישרים יכולים להסתובב, לעבור גזירה או לקרוס. רק כיוונים מיוחדים עשויים להישאר באותו כיוון.',
          'הדטרמיננטה היא תכונה של המטריצה, ולא נקודה במישור.',
        ],
      },
      {
        questionId: 'transformations-scaling', topicId: 'transformations', topicTitle: 'טרנספורמציות לינאריות', concept: 'transformation',
        question: 'מה עושה בדרך כלל מטריצה אלכסונית מבחינה גיאומטרית?',
        options: ['מותחת או מכווצת את כיווני הצירים', 'תמיד מסובבת את המישור', 'מוחקת את ראשית הצירים', 'הופכת כל וקטור לאקראי'], correctIndex: 0,
      },
      {
        questionId: 'transformations-shear', topicId: 'transformations', topicTitle: 'טרנספורמציות לינאריות', concept: 'transformation',
        question: 'כיצד טרנספורמציית גזירה (Shear) צפויה להשפיע על הרשת?',
        options: ['להחליק כיוון אחד תוך שמירה על מקביליות קווי הרשת', 'להפוך כל ריבוע למעגל', 'להזיז את הראשית מהנקודה (0,0)', 'תמיד לאפס את הדטרמיננטה'], correctIndex: 0,
      },
      {
        questionId: 'transformations-rotation-lengths', topicId: 'transformations', topicTitle: 'טרנספורמציות לינאריות', concept: 'transformation',
        question: 'איזו טרנספורמציה שומרת על אורכים ועל זוויות במישור?',
        options: ['סיבוב טהור', 'מתיחה לא אחידה', 'הטלה על ציר x', 'קריסה לווקטור האפס'], correctIndex: 0,
      },
      {
        questionId: 'transformations-reflection-orientation', topicId: 'transformations', topicTitle: 'טרנספורמציות לינאריות', concept: 'transformation',
        question: 'מה קורה בדרך כלל לאוריינטציה תחת מטריצת שיקוף?',
        options: ['האוריינטציה מתהפכת', 'האוריינטציה תמיד נשמרת', 'הרשת נעלמת', 'כל וקטור הופך לווקטור עצמי'], correctIndex: 0,
      },
    ],
  },
  {
    id: 'linear-combinations',
    title: 'צירופים לינאריים',
    description: 'שאלות על שילוב וקטורים באמצעות מקדמים סקלריים.',
    questions: [
      {
        questionId: 'linear-combinations-independent', topicId: 'linear-combinations', topicTitle: 'צירופים לינאריים', concept: 'combination',
        question: 'מתי αu + βv יכול להגיע לכל נקודה במישור כאשר α,β משתנים מעל ℝ?',
        options: ['תמיד', 'כאשר u ו־v מאונכים', 'כאשר u ו־v בלתי תלויים לינארית', 'כאשר לשני הווקטורים אורך 1'], correctIndex: 2,
        explanations: [
          'לא תמיד. אם u ו־v נמצאים באותו כיוון, הם פורשים רק ישר.',
          'מאונכות מספיקה, אך אינה תנאי הכרחי.',
          'נכון. שני וקטורים בלתי תלויים פורשים את כל ℝ².',
          'אורך יחידה אינו מבטיח שהווקטורים יפרשו את המישור.',
        ],
      },
      {
        questionId: 'linear-combinations-definition', topicId: 'linear-combinations', topicTitle: 'צירופים לינאריים', concept: 'combination',
        question: 'איזה מהביטויים הבאים הוא צירוף לינארי של u ושל v?',
        options: ['αu + βv', 'u ÷ v', 'u² + v²', 'נקודה אקראית שאינה קשורה ל־u ול־v'], correctIndex: 0,
      },
      {
        questionId: 'linear-combinations-dependent', topicId: 'linear-combinations', topicTitle: 'צירופים לינאריים', concept: 'combination',
        question: 'אם u ו־v מצביעים באותו כיוון, מה יכולים הצירופים הלינאריים שלהם ליצור ב־ℝ²?',
        options: ['ישר העובר בראשית', 'את כל המישור', 'רק נקודה אחת שאינה הראשית', 'מעגל'], correctIndex: 0,
      },
      {
        questionId: 'linear-combinations-alpha-beta', topicId: 'linear-combinations', topicTitle: 'צירופים לינאריים', concept: 'combination',
        question: 'מה מייצגים α ו־β בביטוי αu + βv?',
        options: ['משקלים סקלריים המוכפלים בווקטורים', 'צירי קואורדינטות חדשים בלבד', 'הדטרמיננטה של המטריצה', 'הזווית בין u ל־v'], correctIndex: 0,
      },
      {
        questionId: 'linear-combinations-zero-vector', topicId: 'linear-combinations', topicTitle: 'צירופים לינאריים', concept: 'combination',
        question: 'אם u ו־v בלתי תלויים, מהי הדרך היחידה לקבל αu + βv = 0?',
        options: ['α = 0 וגם β = 0', 'α = 1 וגם β = 1', 'α חייב להיות שווה ל־β', 'אי אפשר לקבל את וקטור האפס'], correctIndex: 0,
      },
    ],
  },
  {
    id: 'determinant',
    title: 'דטרמיננטה',
    description: 'שאלות על שינוי שטח, אוריינטציה והפיכות.',
    questions: [
      {
        questionId: 'determinant-zero', topicId: 'determinant', topicTitle: 'דטרמיננטה', concept: 'determinant',
        question: 'מה המשמעות הגיאומטרית של det(A) = 0?',
        options: ['השטח נשמר', 'A קורסת את המישור לישר או לנקודה', 'המטריצה מסובבת כל וקטור ב־90°', 'כל וקטור מתארך'], correctIndex: 1,
        explanations: [
          'שימור שטח מתקיים כאשר |det(A)| = 1, ולא כאשר det(A) = 0.',
          'נכון. דטרמיננטה אפס פירושה שהטרנספורמציה מוחצת את השטח ואינה הפיכה.',
          'לסיבוב של 90° דטרמיננטה 1, ולא 0.',
          'מטריצה סינגולרית יכולה להעביר וקטור שאינו אפס לווקטור האפס.',
        ],
      },
      {
        questionId: 'determinant-area-scale', topicId: 'determinant', topicTitle: 'דטרמיננטה', concept: 'determinant',
        question: 'מה מתאר |det(A)| בשני ממדים?',
        options: ['את גורם שינוי השטחים', 'את הכיוון המדויק של כל וקטור', 'את מספר השורות במטריצה', 'את אורכו של v בלבד'], correctIndex: 0,
      },
      {
        questionId: 'determinant-negative', topicId: 'determinant', topicTitle: 'דטרמיננטה', concept: 'determinant',
        question: 'מה מסמנת דטרמיננטה שלילית?',
        options: ['הטרנספורמציה הופכת אוריינטציה', 'הטרנספורמציה תמיד בלתי אפשרית', 'כל הווקטורים הופכים לאפס', 'השטח תמיד נשאר ללא שינוי'], correctIndex: 0,
      },
      {
        questionId: 'determinant-invertible', topicId: 'determinant', topicTitle: 'דטרמיננטה', concept: 'determinant',
        question: 'מתי מטריצה בגודל 2×2 הפיכה?',
        options: ['כאשר det(A) ≠ 0', 'כאשר det(A) = 0', 'רק כאשר כל האיברים חיוביים', 'רק כאשר המטריצה אלכסונית'], correctIndex: 0,
      },
      {
        questionId: 'determinant-unit-area', topicId: 'determinant', topicTitle: 'דטרמיננטה', concept: 'determinant',
        question: 'אם det(A) = 2, מה קורה לשטח ריבוע היחידה?',
        options: ['הוא גדל פי שניים', 'הוא קטן לחצי', 'הוא קורס לשטח אפס', 'הוא חייב להסתובב ב־2 מעלות'], correctIndex: 0,
      },
    ],
  },
  {
    id: 'span-and-basis',
    title: 'מרחב נפרס ובסיס',
    description: 'שאלות על פריסה, אי־תלות לינארית ובסיסים.',
    questions: [
      {
        questionId: 'span-line-or-plane', topicId: 'span-and-basis', topicTitle: 'מרחב נפרס ובסיס', concept: 'span',
        question: 'המרחב הנפרס על ידי שני וקטורים v,u ב־ℝ² הוא...',
        options: ['תמיד ישר', 'תמיד כל המישור', 'ישר או כל המישור, בהתאם לאי־התלות', 'תמיד נקודה יחידה'], correctIndex: 2,
        explanations: [
          'זהו ישר רק כאשר הווקטורים תלויים לינארית.',
          'זהו כל המישור רק כאשר הווקטורים בלתי תלויים לינארית.',
          'נכון. וקטורים תלויים פורשים ישר; וקטורים בלתי תלויים פורשים את המישור.',
          'רק המרחב הנפרס על ידי וקטור האפס בלבד הוא נקודה יחידה.',
        ],
      },
      {
        questionId: 'basis-independent', topicId: 'span-and-basis', topicTitle: 'מרחב נפרס ובסיס', concept: 'basis',
        question: 'מתי שני וקטורים v,u מהווים בסיס ל־ℝ²?',
        options: ['כאשר det [u v] ≠ 0', 'כאשר לשניהם אורך 1', 'כאשר הם מאונכים', 'כאשר det(A) = 1'], correctIndex: 0,
        explanations: [
          'נכון. דטרמיננטה שאינה אפס פירושה שהווקטורים בלתי תלויים ופורשים את ℝ².',
          'אורך יחידה אינו נדרש מבסיס.',
          'מאונכות נוחה, אך אינה נדרשת.',
          'det(A) מתאר את מטריצת הטרנספורמציה, ולא האם u ו־v מהווים בסיס.',
        ],
      },
      {
        questionId: 'span-single-vector', topicId: 'span-and-basis', topicTitle: 'מרחב נפרס ובסיס', concept: 'span',
        question: 'מהו המרחב הנפרס על ידי וקטור יחיד שאינו אפס ב־ℝ²?',
        options: ['ישר העובר בראשית', 'כל המישור', 'מעגל סביב הראשית', 'רק הווקטור עצמו'], correctIndex: 0,
      },
      {
        questionId: 'basis-number-vectors-r2', topicId: 'span-and-basis', topicTitle: 'מרחב נפרס ובסיס', concept: 'basis',
        question: 'כמה וקטורים נדרשים לבסיס של ℝ²?',
        options: ['שני וקטורים בלתי תלויים', 'וקטור אחד שאינו אפס', 'שלושה וקטורים תלויים', 'כל שני וקטורים, גם אם הם מקבילים'], correctIndex: 0,
      },
      {
        questionId: 'span-dependent-vectors', topicId: 'span-and-basis', topicTitle: 'מרחב נפרס ובסיס', concept: 'span',
        question: 'אם שני וקטורים תלויים לינארית, מה המשמעות החזותית?',
        options: ['הם נמצאים על אותו ישר העובר בראשית', 'הם חייבים להיות מאונכים', 'הם תמיד יוצרים בסיס', 'אי אפשר לצייר אותם באותו מישור'], correctIndex: 0,
      },
    ],
  },
  {
    id: 'eigenvectors',
    title: 'וקטורים עצמיים',
    description: 'שאלות על וקטורים עצמיים, ערכים עצמיים וכיוונים אינווריאנטיים.',
    questions: [
      {
        questionId: 'eigenvectors-same-line', topicId: 'eigenvectors', topicTitle: 'וקטורים עצמיים', concept: 'eigen',
        question: 'וקטור עצמי v של A מקיים A·v = λv. מה המשמעות הגיאומטרית?',
        options: ['v מסתובב ב־90°', 'v נשאר על אותו ישר העובר בראשית', 'v חייב להפוך לווקטור האפס', 'אורכו של v תמיד מוכפל'], correctIndex: 1,
        explanations: [
          'וקטור עצמי אינו מסתובב לכיוון של ישר אחר.',
          'נכון. הווקטור עשוי להימתח, להתכווץ או להתהפך, אך הוא נשאר על אותו ישר.',
          'רק ערך עצמי λ = 0 מעביר את הווקטור לאפס, וזה אינו המצב תמיד.',
          'האורך מוכפל רק במקרה המסוים λ = 2.',
        ],
      },
      {
        questionId: 'eigenvectors-eigenvalue-meaning', topicId: 'eigenvectors', topicTitle: 'וקטורים עצמיים', concept: 'eigen',
        question: 'מה מתאר הערך העצמי λ עבור וקטור עצמי?',
        options: ['את גורם הכפל לאורך כיוון הווקטור העצמי', 'את הזווית בין צירי הקואורדינטות', 'את מספר העמודות ב־A', 'את צבע הווקטור בהדמיה'], correctIndex: 0,
      },
      {
        questionId: 'eigenvectors-zero-eigenvalue', topicId: 'eigenvectors', topicTitle: 'וקטורים עצמיים', concept: 'eigen',
        question: 'אם לווקטור עצמי יש ערך עצמי 0, מה קורה לו תחת A?',
        options: ['הוא מועבר לווקטור האפס', 'אורכו תמיד מוכפל', 'הוא מסתובב בדיוק ב־180°', 'הוא הופך למאונך לעצמו'], correctIndex: 0,
      },
      {
        questionId: 'eigenvectors-not-eigenvector', topicId: 'eigenvectors', topicTitle: 'וקטורים עצמיים', concept: 'eigen',
        question: 'כיצד אפשר לזהות חזותית שווקטור אינו וקטור עצמי?',
        options: ['לאחר הטרנספורמציה הוא נמצא בכיוון של ישר אחר', 'אורכו משתנה', 'הוא מתחיל בראשית', 'יש לו שני רכיבים'], correctIndex: 0,
      },
      {
        questionId: 'eigenvectors-negative-eigenvalue', topicId: 'eigenvectors', topicTitle: 'וקטורים עצמיים', concept: 'eigen',
        question: 'מה יכול ערך עצמי שלילי לעשות לווקטור עצמי?',
        options: ['להפוך אותו לכיוון הנגדי על אותו ישר', 'להעביר אותו מחוץ לישר העצמי', 'לגרום לו להפסיק להיות וקטור', 'תמיד לשמור בדיוק על אורכו'], correctIndex: 0,
      },
    ],
  },
];

export const QUIZ_TOPICS = DEFAULT_QUIZ_TOPICS;

export const QUIZZES = DEFAULT_QUIZ_TOPICS.reduce((acc, topic) => {
  topic.questions.forEach((question) => {
    if (!acc[question.concept]) acc[question.concept] = question;
  });
  return acc;
}, {});

export function getAllQuizTopics() {
  return DEFAULT_QUIZ_TOPICS;
}

export function getQuestionsByTopic(topicId) {
  return DEFAULT_QUIZ_TOPICS.find((topic) => topic.id === topicId)?.questions || [];
}

export function getFirstQuestionByTopic(topicId) {
  return getQuestionsByTopic(topicId)[0] || null;
}

export function getTopicById(topicId) {
  return DEFAULT_QUIZ_TOPICS.find((topic) => topic.id === topicId) || null;
}

export function getQuestionById(topicId, questionId) {
  return getQuestionsByTopic(topicId).find((question) => question.questionId === questionId) || null;
}

export function getQuizForConcept(concept) {
  return QUIZZES[concept] || QUIZZES.transformation;
}

export function quizWithoutExplanations(quiz) {
  if (!quiz) return null;
  const { explanations, ...safeQuiz } = quiz;
  return safeQuiz;
}
