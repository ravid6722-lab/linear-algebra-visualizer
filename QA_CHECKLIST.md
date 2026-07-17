# QA Checklist — Linear Algebra Visualizer

Use this checklist before a demo or submission.

## 1. Setup

- [ ] Backend dependencies installed with `npm install`.
- [ ] Frontend dependencies installed with `npm install`.
- [ ] Backend starts with `npm run dev`.
- [ ] Frontend starts with `npm run dev`.
- [ ] Backend health check works: `http://localhost:3000/healthz`.
- [ ] Frontend opens at `http://localhost:5173`.

## 2. Home page

- [ ] Home page loads without errors.
- [ ] `Open Lecturer View` navigates to `/lecturer`.
- [ ] `Join as Student` navigates to `/student`.

## 3. Lecturer flow

- [ ] Lecturer page loads.
- [ ] Clicking `Start Live Session` creates a room.
- [ ] Room code appears once, in the top live session area.
- [ ] Socket status shows connected.
- [ ] Students connected count starts at 0.
- [ ] Creating a new session still works.

## 4. Student flow

- [ ] Student join page loads.
- [ ] Empty nickname shows a clear error.
- [ ] Empty room code shows a clear error.
- [ ] Invalid room code shows a clear error.
- [ ] Valid room code navigates to `/student/:code`.
- [ ] Student room page shows connected status.
- [ ] Lecturer dashboard shows the student nickname.

## 5. Real-time visualization sync

- [ ] Lecturer changes concept and student updates in Follow Lecturer mode.
- [ ] Lecturer changes matrix and student updates.
- [ ] Lecturer changes vector and student updates.
- [ ] Lecturer changes alpha/beta and student updates.
- [ ] Lecturer switches between 2D and 3D and student updates.
- [ ] Lecturer clicks Animate and student animation starts.
- [ ] Student Practice Mode is not overwritten by lecturer state updates.

## 6. 2D visualization

- [ ] Canvas2D renders grid and vectors.
- [ ] Linear transformation view works.
- [ ] Determinant/parallelogram view works.
- [ ] Span/basis/vector combination views still render.
- [ ] Animation works in 2D.

## 7. 3D visualization

- [ ] Canvas3D renders without crashing.
- [ ] Axes/grid/basis vectors appear.
- [ ] Orbit controls work in lecturer view.
- [ ] Lecturer camera movement syncs to student Follow Lecturer mode.
- [ ] Student Practice Mode can move camera independently.

## 8. Live Quiz

- [ ] `Open Live Quiz` works only after a live session starts.
- [ ] Quiz appears on student screens.
- [ ] Student can answer.
- [ ] Student can change answer before `Show Answer`.
- [ ] Lecturer sees response distribution update in real time.
- [ ] `Show Answer` reveals the correct answer.
- [ ] After `Show Answer`, student answers are locked.
- [ ] `Close Quiz` closes the quiz for students.

## 9. Student Answers Panel

- [ ] Connected students appear in the dashboard.
- [ ] Before Show Answer, answered students show `Answered` and answer `Hidden`.
- [ ] Waiting students show `Waiting` and answer `—`.
- [ ] After Show Answer, answers are visible.
- [ ] Results show `Correct`, `Incorrect`, or `No answer`.
- [ ] If a student changes answer before reveal, distribution updates correctly.

## 10. Error handling

- [ ] Backend off: frontend shows a clear connection warning.
- [ ] Backend off: student join shows a clear backend error.
- [ ] Wrong room code shows `Room not found` style message.
- [ ] Missing nickname is blocked.
- [ ] Disabled buttons look disabled and do not trigger actions.

## 11. Backend restart recovery

- [ ] Start a live session.
- [ ] Join a student.
- [ ] Stop backend with `Ctrl + C`.
- [ ] Frontend shows disconnected/warning state.
- [ ] Restart backend with `npm run dev`.
- [ ] Lecturer sees that the old room expired.
- [ ] Lecturer can click `Create New Room`.
- [ ] Student is told to return to join screen and use the new code.
- [ ] Student can join the new room successfully.

## 12. Browser console

- [ ] Normal flow has no red console errors.
- [ ] No repeated noisy logs during normal use.
- [ ] Expected warnings appear only during failure/restart tests.

## 13. Final smoke test

Run this short test immediately before a demo or submission:

- [ ] Start backend and frontend from clean terminals.
- [ ] Open lecturer view and create a room.
- [ ] Join at least one student from another tab.
- [ ] Confirm student appears in the lecturer dashboard.
- [ ] Change a matrix and confirm the student updates in Follow Lecturer mode.
- [ ] Click Animate and confirm the student animation starts.
- [ ] Switch to 3D and confirm camera sync works.
- [ ] Open Live Quiz and submit an answer from the student tab.
- [ ] Change the answer before Show Answer and confirm distribution updates.
- [ ] Click Show Answer and confirm answers lock.
- [ ] Click Close Quiz and confirm the quiz closes for students.
- [ ] Test a narrow browser width and confirm no horizontal overflow.

## 14. Final notes

- [ ] No new demo-only features are visible in the final UI.
- [ ] No database/auth/export functionality is expected in this version.
- [ ] After backend restart, the lecturer creates a new room and students join with the new code.

## 15. Quiz Topic Builder

- [ ] Lecturer can choose an existing quiz topic.
- [ ] Lecturer can choose a question from the selected topic.
- [ ] `Open Live Quiz` is disabled if no topic or no question is selected.
- [ ] Lecturer can add a new topic with a title and description.
- [ ] Empty topic title shows a clear error.
- [ ] Lecturer can add a question to the selected topic.
- [ ] At least two answer options are required.
- [ ] Correct answer must point to an existing option.
- [ ] The newly added question is selected automatically.
- [ ] Refreshing the lecturer page keeps custom topics/questions in the same browser.
- [ ] Opening a Live Quiz from a custom question shows it on the student screen.
- [ ] Student screen displays the topic title when available.
- [ ] `Show Answer`, answer changing, results distribution, and `Close Quiz` still work.
- [ ] `Reset Quiz Library` restores the default topics and removes custom local topics.


## Step 16.1 — Next Question in Same Topic

- [ ] Open a topic with at least two questions.
- [ ] Open the first live quiz question.
- [ ] Answer from a student tab.
- [ ] Click **Show Answer**.
- [ ] Verify **Next Question** appears.
- [ ] Click **Next Question**.
- [ ] Verify the student sees the new question.
- [ ] Verify previous selections and feedback are cleared.
- [ ] Verify results and Student Answers Panel reset for the new question.
- [ ] Verify **No more questions in this topic** appears at the end of a topic.


## Step 16.2 — Live Quiz Update + Responsive Answers Table

- [ ] Open a topic with more than one question.
- [ ] Open a Live Quiz.
- [ ] Let a student answer the question.
- [ ] Select a different question while the quiz is active.
- [ ] Click **Update Live Quiz**.
- [ ] Verify that the student receives the new question.
- [ ] Verify that old answers and feedback are cleared.
- [ ] Verify that Student Answers Panel resets to Waiting.
- [ ] Verify that Show Answer works again for the updated question.
- [ ] Resize the lecturer screen and verify the Student Answers Panel has no horizontal scroll.

## Step 16.3 — Expanded Default Quiz Questions

- [ ] Open the lecturer screen.
- [ ] Open the quiz topic selector.
- [ ] Verify that each default topic has five questions:
  - [ ] Transformations
  - [ ] Linear Combinations
  - [ ] Determinant
  - [ ] Span and Basis
  - [ ] Eigenvectors
- [ ] Open a Live Quiz from one of the new questions.
- [ ] Verify the student receives the question.
- [ ] Verify Show Answer and Next Question still work.
- [ ] If the browser had older local quiz data, verify custom topics/questions were not deleted.
- [ ] Use Reset Quiz Library only if you want to restore the full default library and remove custom local changes.


## Step 16.5 — Quiz Builder Add Topic / Add Question Fix

- [ ] Add a question to an existing topic.
- [ ] Confirm the new question appears under the selected topic.
- [ ] Confirm the new question is selected automatically after saving.
- [ ] Add a new topic.
- [ ] Confirm the new topic is selected automatically.
- [ ] Add a question under the newly created topic.
- [ ] Confirm the Correct answer dropdown shows Option A, Option B, Option C, Option D.
- [ ] Confirm Correct answer does not show the full answer text.
- [ ] Try saving a question with a missing option and confirm validation appears.
- [ ] Open Live Quiz using a newly added question.


## Step 16.6 — Quiz Builder UI Fix

- [ ] Open the lecturer screen and expand `Manage Quiz Topics & Questions`.
- [ ] Verify the summary text is exactly `Manage Quiz Topics & Questions`.
- [ ] Verify the Add Question form has an `Add question under topic` dropdown.
- [ ] Choose an existing topic in the Add Question form and add a question.
- [ ] Add a new topic and verify it is selected automatically.
- [ ] Add a question under the newly created topic.
- [ ] Verify the Correct answer dropdown shows only `Option A`, `Option B`, `Option C`, `Option D`.
- [ ] Verify the Correct answer dropdown does not show the answer text content.
- [ ] Open Live Quiz using the newly added question.

## Step 16.7 — Automatic Concept in Quiz Builder

- [ ] Open `Manage Quiz Topics & Questions`.
- [ ] Verify the Add Question form no longer shows a `Concept` dropdown.
- [ ] Verify `Add question under topic` is still visible.
- [ ] Add a question to an existing topic.
- [ ] Verify `Correct answer` shows only `Option A`, `Option B`, `Option C`, `Option D`.
- [ ] Verify the answer text itself is not shown inside the Correct answer dropdown.
- [ ] Add a new topic, then add a question under the new topic.
- [ ] Open the newly added question as a Live Quiz.

### Step 16.8 — Quiz Result Label Separator Fix
- [ ] Lecturer Live Results show answer labels as `A - answer`, `B - answer`, etc.
- [ ] Student Class Results show answer labels as `A - answer`, `B - answer`, etc.
- [ ] Results no longer show `A · answer` or `A*answer`.

### Step 16.9 — Remove Topic Description from Lecturer View
- [ ] Open the lecturer screen.
- [ ] Verify no topic description appears under the topic selector.
- [ ] Open `Manage Quiz Topics & Questions`.
- [ ] Verify Add New Topic asks only for a topic title.
- [ ] Add a new topic and confirm it is selected automatically.
- [ ] Add a question under the new topic.
- [ ] Open the new question as a Live Quiz.

## Step 17 — Deployment Preparation

- [ ] Create `frontend/.env` from `frontend/.env.example`.
- [ ] Create `backend/.env` from `backend/.env.example`.
- [ ] Verify frontend uses `VITE_SOCKET_URL` for Socket.io.
- [ ] Verify frontend uses `VITE_API_BASE_URL` for REST room calls.
- [ ] Verify backend uses `PORT` from environment variables.
- [ ] Verify backend CORS allows local frontend origin from `CLIENT_URLS`.
- [ ] Verify Socket.io CORS uses the same allowed origins.
- [ ] Run backend locally with `npm run dev`.
- [ ] Run frontend locally with `npm run dev`.
- [ ] Create a lecturer room successfully.
- [ ] Join the room as a student successfully.
- [ ] Verify visualization state sync still works.
- [ ] Verify Live Quiz still works after env changes.
- [ ] Verify `npm run build` succeeds for frontend.
- [ ] Verify backend syntax check succeeds.


## Step 17.1 — Dotenv Install Fix QA

- [ ] Backend starts without requiring the external `dotenv` package.
- [ ] `.env` values are loaded from `backend/.env`.
- [ ] `npm install` no longer tries to download packages from an internal OpenAI registry URL.
- [ ] Live session still works locally.
- [ ] Live Quiz still works locally.

## Step 19 — Persistent Quiz Library with PostgreSQL

- [ ] Backend starts successfully when `DATABASE_URL` is configured.
- [ ] Backend still starts when `DATABASE_URL` is missing, without breaking rooms or Socket.io.
- [ ] `GET /api/quiz-topics` returns default topics from PostgreSQL.
- [ ] Add Topic saves a topic to the server database.
- [ ] Add Question saves a question to the server database.
- [ ] Added topic/question persists after browser refresh.
- [ ] Added topic/question is visible from another browser or computer.
- [ ] Live Quiz opens a question loaded from the database.
- [ ] Next Question works with database-loaded topics.
- [ ] Update Live Quiz works with database-loaded topics.
- [ ] If the database/API is unavailable, the frontend shows local fallback mode.

## Step 20 — Student Practice Mode

- [ ] Student page shows both `Join Live Class` and `Practice Alone` options.
- [ ] Student can open Practice Alone without a room code.
- [ ] Practice Mode opens without requiring a lecturer or live session.
- [ ] Student can change concept, matrix, vectors, 2D/3D mode, and animation locally.
- [ ] Practice changes are not sent to a live class and do not require Socket.io room join.
- [ ] Practice Quiz loads topics from the server database when available.
- [ ] Practice Quiz falls back to local quiz topics if the server library is unavailable.
- [ ] Student can select a topic and question in Practice Quiz.
- [ ] Check Answer shows Correct/Incorrect feedback locally.
- [ ] Next Question works locally inside the selected topic.
- [ ] Practice Quiz does not affect lecturer Live Quiz results or Student Answers Panel.
- [ ] Existing Join Live Class flow still works with room code.
- [ ] Lecturer Start Live Session and Live Quiz still work.

## Step 20.1 — Targeted Delete and Export Cleanup QA

- [ ] Lecturer can open **Manage Quiz Topics & Questions**.
- [ ] Lecturer can select and delete a specific question.
- [ ] Deleted question disappears after refresh when the server database is active.
- [ ] Lecturer can select and delete a specific topic.
- [ ] Deleted topic and its questions disappear after refresh when the server database is active.
- [ ] Targeted deletion also works in local fallback mode if the database is unavailable.
- [ ] Existing Live Quiz flow still works after deleting non-active topics/questions.
- [ ] `Export snapshot` no longer appears in the Animation panel.
- [ ] The app still builds and runs locally.

## 18. Final UI cleanup

- [ ] `Future Full App · Roadmap` panel is not visible in the lecturer page.
- [ ] `Export snapshot` is not visible in the animation controls.
- [ ] Lecturer page still shows Live Session, visualization controls, Quiz Builder, and Footer correctly.

## Step 20.3 — Compact Add Topic Form Layout

- [ ] Lecturer can open Manage Quiz Topics & Questions.
- [ ] Add New Topic form appears compact in full-screen layout.
- [ ] Topic title input has normal height.
- [ ] Add Topic button has normal height and remains usable.
- [ ] Add Question to Topic layout still works.
- [ ] Delete Topic / Delete Question controls still work.
- [ ] Responsive layout still works on small screens.

## Step 20.4 — Abstract Vector Spaces Visualization

- [ ] Concept selector shows `Abstract Vector Spaces`.
- [ ] Selecting the concept hides matrix/vector controls and shows abstract space controls.
- [ ] Polynomials view shows `αp(x) + βq(x)` and updates when α/β change.
- [ ] Functions view shows `αsin(x) + βcos(x)` and updates the plotted result curve.
- [ ] Matrices view shows `αA + βB` and updates the resulting matrix.
- [ ] Insight panel explains the selected abstract vector space.
- [ ] Lecturer live session syncs the selected abstract space to students.
- [ ] Regular concepts still show the original matrix/vector controls and visualizations.


## Step 20.5 QA — Editable Polynomial Objects

- [ ] Abstract Vector Spaces appears in the concept selector.
- [ ] In Polynomials mode, p(x) and q(x) coefficient inputs are visible.
- [ ] Editing a coefficient changes the displayed polynomial.
- [ ] Editing a coefficient updates αp(x) + βq(x).
- [ ] Reset restores the default polynomial examples.
- [ ] In Live Session, lecturer coefficient edits sync to students.
- [ ] Practice Alone supports coefficient editing locally.

## Step 20.6 QA — Polynomial Graph Visualization

- [ ] In `Abstract Vector Spaces → Polynomials`, a graph is displayed below the polynomial cards.
- [ ] The graph shows `p(x)`, `q(x)`, and `r(x) = αp(x) + βq(x)`.
- [ ] Editing a coefficient of `p(x)` updates the corresponding curve.
- [ ] Editing a coefficient of `q(x)` updates the corresponding curve.
- [ ] Changing α or β updates the result curve immediately.
- [ ] Reset restores the polynomial expressions and graph.
- [ ] Lecturer live session syncs polynomial graph changes to students.
- [ ] Practice Alone shows the same graph and updates locally.

## Step 20.7 — Polynomial Graph Colors and RTL Explanations

- [ ] In Abstract Vector Spaces → Polynomials, verify that `p(x)`, `q(x)`, and `r(x)` appear in three distinct colors.
- [ ] Verify that the graph legend colors match the curve colors.
- [ ] Verify that Hebrew text in Explanation and Connection to Linear Algebra is aligned right-to-left.
- [ ] Verify that changing polynomial coefficients still updates the graph.
- [ ] Verify that lecturer/student sync is unchanged.

## Step 20.8 — Greek Coefficient Labels QA

- [ ] In Abstract Vector Spaces, verify the insight/stat cards display `α` and `β` as Greek symbols.
- [ ] Verify the coefficient values still update when changing the sliders.
- [ ] Verify no other stat cards lost their uppercase styling unexpectedly.

- [ ] Verify that in the polynomial editor, p(x) and q(x) appear side by side on wide screens and stack cleanly on narrower screens.

- [ ] Verify polynomial coefficient input values are fully visible when p(x) and q(x) are displayed side by side.

- [ ] Verify polynomial coefficient input boxes do not overflow outside the p(x)/q(x) cards.

- [ ] Verify that Abstract Vector Spaces → Functions includes a Function Pair selector.
- [ ] Verify that sin/cos, exponential, and Gaussian-like pairs update the formula and graph correctly.
- [ ] Verify that polynomial pairs do not appear under Functions because they already exist under Polynomials.
- [ ] Verify that selected function pair syncs from lecturer to student during a Live Session.

- [ ] Verify that Abstract Vector Spaces → Matrices lets the lecturer edit A and B entries and updates αA + βB immediately.
- [ ] Verify that editable matrix values sync from lecturer to student during a Live Session.

- [ ] Verify that Abstract Vector Spaces → Matrices displays Matrix A and Matrix B in bracket-style 2×2 input layout.
- [ ] Verify that editing Matrix A/B still updates αA + βB.

- [ ] Verify that Matrix A/B input boxes stay inside the matrix editor card on narrow and wide screens.
- [ ] Verify polynomial coefficient number arrows change values by 1.
- [ ] Verify abstract matrix entry number arrows change values by 1.
- [ ] Verify that main Matrix A inputs increment/decrement by 1 using number arrows.
- [ ] Verify that v/u vector inputs increment/decrement by 1 using number arrows.
- [ ] Verify that α/β sliders still behave smoothly.

- [ ] Verify that 2D visualization stays visible when matrix entries are increased to values such as 6, 7, and 8.
- [ ] Verify that small/default matrices still remain readable after adaptive zoom.

- [ ] Verify 2D zoom controls zoom in, zoom out, and reset without breaking adaptive canvas scaling.

- [ ] Verify that the 2D area card displays `AREA = value`.
- [ ] Verify that mouse wheel zoom works inside the 2D canvas.
- [ ] Verify that the existing 2D zoom buttons still work.

- [ ] Verify mouse wheel over the 2D canvas zooms only the graph and does not scroll the page.
- [ ] Verify mouse wheel outside the 2D canvas scrolls the page normally.

- [ ] Verify that `AREA = value` appears in the top-left 2D graph overlay for Linear Transformation and Determinant.
- [ ] Verify that `AREA = value` is not displayed as a separate card below the canvas.
- [ ] Verify that 2D zoom buttons and mouse-wheel zoom still work.

- [ ] Verify vector u is greyed out and disabled in Linear Transformation, Determinant, Eigenvectors, and Abstract Vector Spaces.
- [ ] Verify vector u remains editable in Linear Combination, Span/Basis, and Change of Basis.

- [ ] In Linear Combination, verify that βv and αu+βv are drawn in clearly different colors.

- [ ] In Linear Combination, verify that the top-left legend shows separate entries for `v → βv`, `u → αu`, and `αu + βv`.
- [ ] Verify that the combination legend chip uses the same accent color as the final combination vector in the graph.
- [ ] Verify that the Live Insight panel shows `u`, `αu`, `βv`, and `αu + βv` with colors matching the Canvas2D visualization.

- [ ] In Linear Combination, verify that Matrix A inputs and presets are disabled and greyed out.
- [ ] Verify that Matrix A still works normally in Linear Transformation and other matrix-based concepts.
- [ ] In Linear Combination 2D, verify that î and ĵ are not drawn and not listed in the overlay.
- [ ] Verify that Linear Combination Live Insight does not show det(A), invertibility, inverse matrix, or transformation type.
- [ ] Verify that Linear Combination Live Insight shows α, β, u, v, αu, βv, and αu+βv.

- [ ] Verify Matrix A is active in Linear Transformation, Determinant, and Eigenvectors.
- [ ] Verify Matrix A is disabled in Linear Combination, Span/Basis, Change of Basis, and Abstract Vector Spaces.
- [ ] Verify Span/Basis and Change of Basis Live Insight do not show det(A), invertibility, or A⁻¹.
- [ ] Verify Span/Basis and Change of Basis visualizations use u and v directly, not A·u or A·v.
- [ ] Verify Abstract Vector Spaces still allows editing its internal polynomial/function/matrix objects.

- [ ] In Determinant, verify that vector v is greyed out and disabled.
- [ ] In Determinant, verify that α and β are greyed out and disabled.
- [ ] In Determinant, verify that A·v and its label do not appear on the graph.
- [ ] In Determinant, verify that the graph still shows the determinant area/parallelogram.
- [ ] In Determinant Live Insight, verify that det(A), AREA = |det(A)|, invertibility, and orientation reversal are displayed.
- [ ] Verify that A·v still appears in Linear Transformation.


- [ ] In Eigenvectors, verify that v appears on the 2D graph as a semi-transparent purple vector.
- [ ] In Eigenvectors, verify that A·v still appears on the graph and can be visually compared to v.
- [ ] In Eigenvectors, verify that α and β are greyed out and disabled.
- [ ] Verify α and β remain editable in Linear Combination and other relevant concepts.

- [ ] In Span/Basis 2D, verify Vector Readout shows `span{u,v} = R²` when u and v are independent.
- [ ] In Span/Basis 2D, verify Vector Readout shows `span{u,v} = line` when u and v are dependent.
- [ ] In Span/Basis 3D, verify Vector Readout shows the relevant spanned space, such as `plane in R³` or `line`.
- [ ] Verify α and β are greyed out and disabled in Span/Basis.
- [ ] Verify α and β remain active in Linear Combination.


- [ ] In Change of Basis, verify B = {u, v} appears in Live Insight.
- [ ] In Change of Basis, verify Basis valid? shows Yes/No based on whether u and v are independent.
- [ ] In Change of Basis, verify span{u,v} shows R²/line in 2D and plane in R³/line/{0} in 3D.
- [ ] In Change of Basis, verify vector w is drawn and labeled on the graph.
- [ ] In Change of Basis, verify Vector Readout shows w and [w]B = (1, 1).
- [ ] In Change of Basis 2D, verify det([u v]) appears in the top-left graph overlay and no longer appears as a separate card below the graph.
- [ ] In Change of Basis, verify α and β are disabled and greyed out.


- [ ] In Change of Basis, verify that changing α or β updates `w = αu + βv` on the graph.
- [ ] In Change of Basis Live Insight, verify that `[w]B` changes with α and β instead of staying `(1, 1)`.
- [ ] Verify that α and β are active in Change of Basis but still disabled in Span/Basis.

- [ ] In **Change of Basis** with **3D** selected, the legend shows **u**, **v**, and **w = αu + βv**.

- [ ] In Eigenvectors 3D, verify that v appears as a semi-transparent vector, A·v appears as a solid vector, and a guide line is shown through v.
- [ ] In Eigenvectors Live Insight, verify that collinearity/eigenvector status and λ update when v or Matrix A changes.

- [ ] Clicking **Rotate** repeatedly cycles through 45°, 90°, 135°, 180°, 225°, 270°, 315°, and back to the original identity matrix in both 2D and 3D.

- [ ] In the lecturer quiz editor, entering `$A\vec{v}=\lambda\vec{v}$` shows a rendered preview.
- [ ] The same LaTeX question renders correctly in Live Quiz, Student screen, Practice Mode, and results.
- [ ] The Rotate button still cycles through several rotation angles before returning to Identity.

- [ ] Confirm the 2D x/y axes include arrowheads in their positive directions.
- [ ] Confirm the 3D x/y/z axes include arrowheads in their positive directions.

- [ ] In 2D default zoom, the positive x and positive y axis arrowheads are visible without zooming out.
- [ ] In 3D default zoom, the positive x, y, and z axis arrowheads are visible without zooming out.
- [ ] In 2D Linear Transformation, click a matrix preset and then Animate; verify the vector/basis transition visibly replays from the start.
- [ ] In 3D Linear Transformation, click a matrix preset and then Animate; verify the cube/basis/vector transition visibly replays from the start.
- [ ] Verify LaTeX quiz rendering still works after the animation fix.
- [ ] Verify Rotate still cycles through the preset angles.
- [ ] In Linear Transformation 2D, verify the original vector **v** is visible together with **A·v**.
- [ ] In Linear Transformation 3D, verify the original vector **v** is visible together with **A·v**.
- [ ] In Linear Transformation 2D animation, the semi-transparent original vector v remains visually fixed in length while only A(t)·v changes.

- [ ] In Manage Quiz Topics & Questions, verify that an existing topic title can be edited and saved.
- [ ] Verify that an existing question text, answer options, and correct answer can be edited and saved.
- [ ] Verify LaTeX preview works while editing an existing question.
- [ ] Verify edited questions can still be opened as live quizzes.
