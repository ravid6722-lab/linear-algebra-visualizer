# Project Summary — Linear Algebra Visualizer

## Overview

The project is an interactive classroom system for visualizing linear algebra concepts. It combines mathematical visualization, lecturer-student synchronization, and live quiz feedback to support active learning during class.

## Step 1–5: Frontend and Visualization

The first stages built the frontend foundation using React and Vite. The interface was split into reusable components such as the header, concept selector, matrix/vector input panels, animation controls, visualization area, insight panel, quiz card, and footer.

The math logic was connected to real linear algebra calculations such as matrix-vector multiplication, determinant, inverse, linear combinations, and transformation interpretation. Canvas2D was added for two-dimensional visualization, including grids, transformed basis vectors, determinant area, vector combinations, span, and animation. Later, Canvas3D was added with React Three Fiber and Three.js to support 3D axes, basis vectors, transformations, camera controls, and visual exploration.

## Step 6–8: Backend, Rooms, and Presence

The backend was introduced using Node.js, Express, and Socket.io. It added REST endpoints for health checks and room management:

- `GET /healthz`
- `POST /api/rooms`
- `GET /api/rooms/:joinCode`

Rooms are stored in memory. The lecturer can create a room and students can join with a room code. Socket.io presence was added so the lecturer can see how many students are connected and their nicknames.

## Step 9: Real-time Synchronization

Step 9 added real-time synchronization from lecturer to students. When the lecturer changes the visualization state, the update is sent to the backend and broadcast to students in the same room.

The synchronized state includes:

- dimension: 2D / 3D
- concept
- matrix A
- vectors
- alpha / beta values
- animation parameter
- animation speed
- 3D camera state

Students have two modes:

- `Follow Lecturer` — receives live updates from the lecturer.
- `Practice Mode` — allows local exploration without being overwritten by lecturer updates.

Step 9.1 also added synchronization for animation triggers and 3D camera movement.

## Step 10: Live Quiz

Step 10 introduced a live classroom quiz mechanism. The lecturer can open a quiz, students answer in real time, and the backend aggregates the responses.

The quiz flow includes:

- `Open Live Quiz`
- student answer submission
- answer changing before reveal
- live response distribution
- `Show Answer`
- `Close Quiz`

The correct answer is not shown automatically. The lecturer controls when to reveal it using `Show Answer`. Students can change their answers until the answer is revealed.

## Step 11: Lecturer Dashboard

Step 11 improved the lecturer screen into a clearer live session dashboard. It now shows:

- room code
- socket status
- connected students count
- connected student nicknames
- active quiz status
- student answer status table

The Student Answers Panel shows who answered and who is still waiting. Before `Show Answer`, answers are hidden. After reveal, each student's answer and result are shown as `Correct`, `Incorrect`, or `No answer`.

## Step 12: Error Handling and Recovery

Step 12 focused on polish, stability, and production readiness. It added clearer UI messages and safer backend validation.

Improvements include:

- clearer errors for missing nickname or invalid room code
- connection status badges
- backend Socket.io payload validation
- safer event handling with error responses
- clearer backend logs
- recovery UX after backend restart
- robust student room join flow

Because rooms are stored in memory, restarting the backend deletes existing rooms. The UI now explains this clearly and lets the lecturer create a new room, while students are directed back to the join screen.

## Current limitations

The current system is intentionally still lightweight in several areas:

- no login/authentication
- no persistent student grade history
- no classroom history management
- no export snapshot feature in the final UI

These limitations are acceptable for the current project scope because the focus is on visualization, live classroom interaction, quiz management, database-backed quiz storage, and independent student practice.

## Current status

The application now supports a complete live classroom flow:

1. Lecturer creates a room.
2. Students join with a code.
3. Lecturer controls a 2D/3D linear algebra visualization.
4. Students follow the lecturer or practice independently.
5. Lecturer opens live quizzes.
6. Students answer and can change answers before reveal.
7. Lecturer views live results and student status.
8. The app handles common errors and backend restart scenarios more clearly.

## Step 14: UI/UX Final Polish + Responsive Layout

Step 14 focused on final interface polish rather than adding a new feature. The landing page, lecturer workspace, student workspace, quiz area, dashboard, and status messages were refined for clearer hierarchy, more consistent spacing, better button states, and improved responsiveness. Wide screens keep a structured workspace layout, while narrower screens collapse into a readable single-column layout. Existing functionality such as visualization, synchronization, Live Quiz, student answer tracking, and backend restart recovery was preserved.


## Step 15: Manual QA + Final Bug Fixes

Step 15 was a final QA and stability pass. No new major feature was added. The focus was to verify the complete application flow before demonstration or submission: setup, lecturer room creation, student join, real-time synchronization, 2D/3D visualization, animation sync, 3D camera sync, Live Quiz, Student Answers Panel, backend restart recovery, and responsive layout.

The QA documentation was updated to reflect the final application behavior. The final expected recovery behavior after backend restart is that the old in-memory room expires, the lecturer creates a new room, and students rejoin using the new room code.

## Step 16: Lecturer Quiz Topic & Question Builder

Step 16 added a local quiz library for the lecturer. Quiz questions are now organized by topics such as Transformations, Linear Combinations, Determinant, Span and Basis, and Eigenvectors. The lecturer can select a topic, select a question from that topic, and open that question as a Live Quiz.

The lecturer can also add new topics and add new questions to the selected topic directly from the lecturer screen. These custom topics and questions are stored in the browser using `localStorage`, so they remain available after refreshing the page on the same computer and browser. They are not yet shared between different computers because the system still does not use a database.

The Live Quiz backend flow did not change: the frontend sends the selected quiz object through the existing `lecturer:open-quiz` event, and students answer through the existing live quiz events. Student screens now show the topic title when a quiz includes one.


## Step 16.1 — Next Question in Same Topic

Added a controlled classroom flow for moving from one quiz question to the next inside the same topic. After the lecturer reveals the answer, a **Next Question** button appears when another question exists in that topic. Opening the next question reuses the existing live quiz event, resets previous student responses, hides the answer again, and updates students with the new question.


## Step 16.2 — Live Quiz Selection Sync + Responsive Answers Table

Step 16.2 improved the Live Quiz flow by allowing the lecturer to update an active quiz with a different selected question. The same `lecturer:open-quiz` event is reused, so the backend replaces the active quiz, clears previous responses, and broadcasts the new question to students. The Student Answers Panel was also updated to avoid horizontal scrolling by wrapping table content and switching to a compact card layout on narrow screens.

## Step 16.3 — Expanded Default Quiz Questions

Step 16.3 expanded the built-in quiz library so that every existing default topic now starts with five questions. The topics are Transformations, Linear Combinations, Determinant, Span and Basis, and Eigenvectors. Custom topics and custom questions are still preserved in `localStorage`.

The quiz storage helper now merges new default questions into an existing local quiz library. This means that if the browser already has quiz data saved from an earlier version, the new default questions are added without deleting custom lecturer-created topics or questions.


## Step 16.5 — Quiz Builder Add Topic / Add Question Fix

Step 16.5 improves the lecturer quiz builder. The lecturer can add questions to an existing topic, create a new topic, and immediately add questions under the new topic because it is selected automatically after creation. The Correct answer dropdown now uses stable labels, Option A through Option D, instead of displaying the full answer texts. This makes answer selection clearer and avoids long or duplicated answer text inside the dropdown.


## Step 16.6 — Quiz Builder UI Fix

Refined the Quiz Builder UI. The management section is now labeled `Manage Quiz Topics & Questions`, the Add Question form includes its own topic selector so the lecturer can choose where to save the new question, and the Correct answer dropdown now uses fixed labels `Option A` through `Option D` instead of showing answer text.

## Step 16.7 — Automatic Concept in Quiz Builder

The Quiz Builder was simplified by removing the manual `Concept` dropdown from the Add Question form. Lecturers now choose only the target topic for a new question, and the app automatically infers the internal concept from that topic. The Correct Answer dropdown was kept simple and now displays only `Option A`, `Option B`, `Option C`, and `Option D`, without showing long answer text.

## Step 16.8 — Quiz Result Label Separator Fix

Updated the quiz result labels in the lecturer Live Results panel and the student Class Results panel so options are displayed as `A - answer`, `B - answer`, `C - answer`, and `D - answer` instead of using a dot/star-like separator. This is a UI-only change and does not affect quiz logic, scoring, Socket.io events, or localStorage behavior.

## Step 16.9 — Remove Topic Description from Lecturer View

The lecturer quiz interface was simplified by removing the visible topic description from the Quiz Topics area and from the Add New Topic form. The lecturer now creates a topic using only its title, then adds questions under that topic. This keeps the quiz management flow focused and avoids unnecessary text in the lecturer view.

## Step 17 — Deployment Preparation

Step 17 prepared the project for future deployment without deploying it yet. Hard-coded frontend/backend local URLs were moved into environment variables. The frontend now reads `VITE_SOCKET_URL` for Socket.io and `VITE_API_BASE_URL` for REST requests, with local fallback values for development.

The backend now loads environment variables through `dotenv`, reads `PORT` from `process.env`, and uses `CLIENT_URLS` / `CLIENT_URL` to configure CORS for both Express and Socket.io. This allows local development origins and future production frontend domains to be configured without changing source code.

Deployment documentation was added in `README_DEPLOYMENT.md`, including local `.env` setup, production environment examples, and the recommended Step 18 deployment path: frontend to Vercel/Netlify and backend to Render/Railway.


## Step 17.1 — Dotenv Install Fix

Removed the external dotenv runtime dependency and added a local `.env` loader so the backend can run even when npm cannot install dotenv from a generated lockfile URL. The package-lock registry URLs were also normalized to public npm registry URLs.

## Step 19 — Persistent Quiz Library with PostgreSQL

Step 19 moved the Quiz Topics and Question Builder from browser-only `localStorage` to a persistent PostgreSQL-backed library. The backend now exposes REST API routes for loading quiz topics, creating topics, adding questions, updating topics, and deleting topics. On startup, the backend initializes the database schema and seeds default quiz topics/questions if the database is empty. The frontend now uses the backend database as the primary quiz library source, while keeping `localStorage` as a fallback if the server database is unavailable.

## Step 20 — Student Practice Mode

Step 20 adds a standalone student practice flow. Students can now choose **Practice Alone** from the student entry page and use the visualization workspace without a lecturer, live room, or room code. In this mode, matrix/vector changes, concept selection, 2D/3D switching, and animation are local only and are not sent through Socket.io.

The practice page also includes a Practice Quiz panel that loads quiz topics from the backend database when available, with local fallback if the server library is unavailable. Students can select a topic, select a question, choose an answer, click **Check Answer**, see whether the answer is correct, and move to the next question locally. This practice flow does not affect Live Quiz state, lecturer dashboards, class results, or student answer panels.

## Step 20.1 — Targeted Quiz Library Delete + UI Cleanup

This cleanup step added targeted delete controls to the lecturer quiz builder. The lecturer can now delete a selected topic, including its questions, or delete a selected question from a selected topic. The feature works with the PostgreSQL-backed server quiz library and also with the local fallback library if the database is unavailable. The old `Reset Local Fallback Library` control was removed from the visible UI to avoid accidental deletion of broad sets of questions.

The unused `Export snapshot` control was also removed from the animation panel, and the related roadmap item was removed because that feature was not implemented and is not part of the current project scope.

## Step 20.2 — Roadmap Panel Removal

The old `Future Full App · Roadmap` panel was removed from the lecturer view because it described early planned prototype features rather than the current final product. The related React component import, visible panel, and unused Roadmap styling were removed so the final UI stays focused on the implemented project features: live sessions, visualization, quiz management, database-backed quiz library, and student practice mode.

## Step 20.3 — Compact Add Topic Form Layout

The lecturer Quiz Builder layout was refined so the Add New Topic form remains compact and aligned at the top of the management panel. The form controls no longer stretch vertically in wide/full-screen layouts, improving readability and usability while preserving the existing quiz topic and question management features.

## Step 20.4 — Abstract Vector Spaces Visualization

Added a new `Abstract Vector Spaces` concept that visualizes vector spaces beyond arrows in R² and R³. The new mode demonstrates that polynomials, functions and matrices can behave as vectors when addition and scalar multiplication are defined. The user can choose an abstract space, change scalar coefficients α and β, and observe the resulting linear combination. The lecturer can also present this mode during a live session because the selected abstract space is included in the synchronized visualization state.


## Step 20.5 — Editable Polynomial Objects

The Abstract Vector Spaces visualization was expanded so the polynomial objects are no longer fixed examples. Users can edit the coefficients of p(x) and q(x), adjust α and β, and immediately see the resulting linear combination. This makes the abstract vector space demonstration more interactive and reinforces the idea that polynomials can be represented as coefficient vectors.

## Step 20.6 — Polynomial Graph Visualization

The Abstract Vector Spaces polynomial view was expanded with a graph visualization. In Polynomials mode, the app now displays the curves for `p(x)`, `q(x)`, and `r(x) = αp(x) + βq(x)` over a fixed x-range. The graph updates immediately when the user changes polynomial coefficients or scalar values α and β. This adds a visual layer to the abstract vector space example and helps connect coefficient-based algebraic operations with the graphical behavior of the resulting polynomial.

## Step 20.7 — Polynomial Graph Colors and RTL Explanations

- Updated the polynomial graph legend and curves so `p(x)`, `q(x)`, and `r(x) = αp(x) + βq(x)` use clearly distinguishable colors.
- Added RTL styling for Hebrew explanation text in the Abstract Vector Spaces insight panel.
- No backend logic was changed.

## Step 20.8 — Greek Coefficient Labels

The Abstract Vector Spaces insight panel was updated so the scalar labels appear as the mathematical symbols `α` and `β` rather than being transformed visually into `A` and `B` by uppercase styling. This improves consistency with the formula `r(x) = αp(x) + βq(x)` and makes the interface clearer for students.

- Step 20.9: Improved polynomial editor layout so p(x) and q(x) appear side by side on wider screens and stack responsively on narrower screens.

- Step 20.10: Widened the editable polynomial coefficient inputs so numeric values are clearly visible in the side-by-side layout.

- Step 20.11: Fixed the polynomial coefficient editor so input boxes stay inside the p(x)/q(x) cards while the two polynomial panels remain side by side on wider screens.

- Step 20.12: Added a Function Pair selector for Abstract Vector Spaces → Functions. The user can now choose sin/cos, exponential growth/decay, or Gaussian-like function pairs. Polynomial pairs were not added under Functions because they are handled in the dedicated Polynomials view.


## Step 20.13 — Editable Matrix Objects

Abstract Vector Spaces → Matrices now lets the user edit the entries of the 2×2 matrices A and B. The result matrix αA + βB updates immediately, and the values are included in the live sync snapshot so lecturer changes can appear on student screens.

- Step 20.14: Updated the editable matrix input UI in Abstract Vector Spaces to a bracket-style 2×2 matrix layout.

- Step 20.15: Fixed the editable matrix input layout so Matrix A and Matrix B stay inside their card and do not overflow on narrow panels.
- Step 20.17: Updated polynomial coefficient inputs and abstract matrix entry inputs so number arrows increment by 1 instead of 0.5.
- Step 20.18: Updated the main matrix and vector number inputs so browser arrow controls change values by 1 instead of 0.1.

- Step 20.19: Added adaptive 2D canvas zoom so larger matrix entries, including values up to about 8 in common demonstrations, remain visible in the visualization instead of leaving the canvas.

- Step 20.20: Added manual 2D zoom controls on top of the adaptive Canvas2D scaling so users can zoom in/out when labels become too small.

- Step 20.22: Updated the 2D area display to show `AREA = value` instead of determinant notation, and added mouse wheel zoom support for the 2D canvas.

- Step 20.23: Changed 2D mouse-wheel zoom so scrolling is prevented only while the pointer is over the 2D visualization; normal page scrolling works elsewhere.

- Step 20.24: Moved the 2D `AREA = value` readout into the top-left canvas overlay so it stays close to the graph information without covering vectors or the parallelogram.

- Step 20.25: Disabled and greyed out vector u in concepts where it is not mathematically relevant, while keeping it active for Linear Combination, Span/Basis, and Change of Basis.

- Step 20.26: Separated the Linear Combination final vector color from the βv vector color for clearer Canvas2D interpretation.

- Step 20.27: Updated Linear Combination legend/readout labels so the combination vector has its own matching accent color, and the Live Insight panel now shows additional u/αu/βv readouts with colors aligned to the graph.

- Step 20.28: In Linear Combination, Matrix A is disabled because it is not part of the concept, basis vectors î/ĵ are hidden from the 2D graph, and Live Insight now shows only combination-relevant information.

- Step 20.29: Disabled Matrix A in concepts where it is not mathematically relevant, and updated Span/Basis and Change of Basis visualizations and Live Insight to focus on u and v instead of matrix properties.

- Step 20.30: Cleaned up the Determinant concept by disabling v/α/β inputs, removing A·v from determinant visualizations, and making Live Insight focus on determinant, area scaling, invertibility, and orientation reversal.


- Step 20.31: In Eigenvectors, added the input vector v back onto the 2D graph as a semi-transparent purple reference vector, while α and β are now disabled because they are not used in this concept.

- Step 20.32: Updated Span/Basis Live Insight so Vector Readout explicitly states `span{u,v} = line/R²` in 2D and the relevant spanned space in 3D, and disabled α/β controls in the Span/Basis concept.


- Step 20.33: Updated Change of Basis to show u and v as the new basis B, added a sample vector w = u + v with [w]B = (1, 1), moved det([u v]) into the top-left graph overlay in 2D, and disabled α/β controls in this concept.


- Step 20.34: Updated Change of Basis so w is computed as `w = αu + βv`, `[w]B` updates according to the current α/β values, and α/β controls are active in Change of Basis.


- Step 20.35: Added **w = αu + βv** to the 3D legend in Change of Basis so the 3D overlay matches the vector shown in the scene and the 2D/readout explanations.


- Step 20.36: Updated the 3D Eigenvectors view to show the input vector v, the transformed vector A·v, a guide line through v, and Live Insight checks for collinearity/eigenvector status and λ.

- Step 20.38: Updated the **Rotate** matrix preset so repeated clicks cycle through additional rotation angles and eventually return to the identity/original rotation state.

- Step 20.39: Restored LaTeX quiz rendering after the Rotate preset-cycle update. Re-added `LatexText.jsx`, KaTeX dependency, LaTeX rendering in lecturer/student/practice quiz views, and preserved the Rotate cycle behavior.


- Step 20.40: Added positive-direction arrowheads to the coordinate axes in both the 2D canvas and 3D scene.

- Step 20.41: Adjusted 2D axis direction arrowheads so they stay inside the visible canvas at the default zoom, instead of appearing only after zooming out.

- Step 20.42: Adjusted the 3D default framing and shortened the visible axis arrow extents so the x/y/z direction arrowheads are visible at the default zoom, not only after zooming out.

- Step 20.43: Fixed animation replay in both 2D and 3D by forcing the visualization to render the start state before the animation frames advance. This preserves LaTeX, Rotate cycling, and axis arrow fixes.

- Step 20.44: Added the original input vector **v** to the Linear Transformation visualization in both 2D and 3D, shown semi-transparently beside the transformed vector **A·v**.

- Step 20.45: Stabilized 2D animation viewport scaling by calculating adaptive zoom from the final matrix instead of the interpolated matrix, so the original input vector v no longer appears to shrink during Linear Transformation animation.

- Step 20.48: Added editing for existing quiz topics and questions in Manage Quiz Topics & Questions, including title edits, question text edits, answer option edits, correct-answer edits, LaTeX previews, and persistence through both the server quiz database and local fallback.
