// examples/learn-proof/src/App.tsx
// Main application — manages routing between pages and the Lumina panel

import React, { useState } from 'react';
import type { AppPage, Course, Lesson } from './store/app-store.js';
import { MOCK_COURSES, MOCK_LESSONS } from './store/app-store.js';
import { LuminaPanel } from './components/LuminaPanel.js';
import { LoginPage } from './pages/LoginPage.js';
import { CourseListPage } from './pages/CourseListPage.js';
import { LessonListPage } from './pages/LessonListPage.js';
import { ExercisePage } from './pages/ExercisePage.js';
import { ResultPage } from './pages/ResultPage.js';
import type { WorkflowStateId } from '@lumina/contracts';
import { useLumina } from '@lumina/react';

const WORKFLOW_STATES = [
  { state: 'login', label: 'Login' },
  { state: 'course-select', label: 'Select Course' },
  { state: 'lesson-select', label: 'Select Lesson' },
  { state: 'read-material', label: 'Read Material' },
  { state: 'open-exercise', label: 'Open Exercise' },
  { state: 'submit-proof', label: 'Submit Proof' },
  { state: 'verification', label: 'Verification' },
  { state: 'result', label: 'Result' },
];

function getAppPageFromState(stateId: string): AppPage {
  switch (stateId) {
    case 'login': return 'login';
    case 'course-select': return 'courses';
    case 'lesson-select': return 'lessons';
    case 'read-material': return 'material';
    case 'open-exercise':
    case 'submit-proof':
    case 'verification':
      return 'exercise';
    case 'result': return 'result';
    default: return 'login';
  }
}

export default function App() {
  const { currentState, reset: runtimeReset, advanceState, updateGoalContext } = useLumina();
  const [state, setState] = useState({
    selectedCourse: null as Course | null,
    selectedLesson: null as Lesson | null,
    user: null as { name: string; email: string; avatar: string } | null,
    isLoggedIn: false,
  });

  const currentPage = getAppPageFromState(currentState);

  const navigate = (page: AppPage, nextState?: WorkflowStateId) => {
    if (nextState) {
      advanceState(nextState);
    }
  };

  const handleLogin = (email: string) => {
    setState((prev) => ({
      ...prev,
      isLoggedIn: true,
      user: {
        name: email.split('@')[0] ?? 'User',
        email,
        avatar: (email[0] ?? 'U').toUpperCase(),
      },
    }));
    advanceState('course-select');
  };

  const handleSelectCourse = (course: Course) => {
    setState((prev) => ({
      ...prev,
      selectedCourse: course,
    }));
    updateGoalContext({ courseId: course.id });
    advanceState('lesson-select');
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setState((prev) => ({
      ...prev,
      selectedLesson: lesson,
    }));
    const nextState = lesson.type === 'exercise' ? 'submit-proof' : 'read-material';
    updateGoalContext({ lessonId: lesson.id });
    advanceState(nextState);
  };

  const handleSubmitProof = () => {
    advanceState('result');
  };

  const handleRestart = () => {
    runtimeReset();
    setState({
      selectedCourse: null,
      selectedLesson: null,
      user: null,
      isLoggedIn: false,
    });
  };

  const currentStateIndex = WORKFLOW_STATES.findIndex((s) => s.state === currentState);
  const isLoggedIn = state.isLoggedIn;

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'courses':
        return <CourseListPage courses={MOCK_COURSES} onSelectCourse={handleSelectCourse} />;
      case 'lessons':
        return (
          <LessonListPage
            course={state.selectedCourse!}
            lessons={MOCK_LESSONS.filter((l) => l.courseId === state.selectedCourse?.id)}
            onSelectLesson={handleSelectLesson}
            onBack={() => navigate('courses', 'course-select')}
          />
        );
      case 'exercise':
        return (
          <ExercisePage
            lesson={state.selectedLesson!}
            course={state.selectedCourse!}
            onSubmit={handleSubmitProof}
            onBack={() => navigate('lessons', 'lesson-select')}
          />
        );
      case 'result':
        return (
          <ResultPage
            lesson={state.selectedLesson!}
            onRestart={handleRestart}
          />
        );
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <main style={{ flex: 1 }}>
          {renderPage()}
        </main>
        <div style={{ width: 360 }}>
          <LuminaPanel currentPage={state.currentPage} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <a className="app-logo" href="#" onClick={(e) => { e.preventDefault(); navigate('courses', 'course-select'); }}>
          <div className="app-logo-icon">🎓</div>
          <span>Learn Proof</span>
          <span className="app-logo-sub">× Lumina.js</span>
        </a>

        <div className="header-user">
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {state.currentState}
          </span>
          <div
            id="user-avatar"
            className="user-avatar"
            title={state.user?.email}
          >
            {state.user?.avatar}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-section-title">Navigation</div>
        <button
          className={`sidebar-item ${state.currentPage === 'courses' ? 'active' : ''}`}
          onClick={() => navigate('courses', 'course-select')}
          id="nav-courses"
        >
          <span className="sidebar-item-icon">📚</span>
          Courses
        </button>
        {state.selectedCourse && (
          <button
            className={`sidebar-item ${state.currentPage === 'lessons' ? 'active' : ''}`}
            onClick={() => navigate('lessons', 'lesson-select')}
            id="nav-lessons"
          >
            <span className="sidebar-item-icon">📖</span>
            {state.selectedCourse.title}
          </button>
        )}
        {state.selectedLesson && state.currentPage === 'exercise' && (
          <button
            className={`sidebar-item active`}
            id="nav-exercise"
          >
            <span className="sidebar-item-icon">✏️</span>
            {state.selectedLesson.title}
          </button>
        )}

        {/* Workflow Steps */}
        <div className="workflow-steps" style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Workflow State
          </div>
          {WORKFLOW_STATES.map((item, idx) => {
            const isDone = idx < currentStateIndex;
            const isActive = idx === currentStateIndex;
            return (
              <div
                key={item.state}
                className={`workflow-step-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="workflow-step-dot" />
                {item.label}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Lumina Panel */}
      <LuminaPanel currentPage={state.currentPage} />
    </div>
  );
}

