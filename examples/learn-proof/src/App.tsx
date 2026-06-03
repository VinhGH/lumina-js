// examples/learn-proof/src/App.tsx
// Main application — manages routing between pages and the Lumina panel

import React, { useState } from 'react';
import type { AppState, AppPage, Course, Lesson } from './store/app-store.js';
import { initialAppState, MOCK_COURSES, MOCK_LESSONS } from './store/app-store.js';
import { LuminaPanel } from './components/LuminaPanel.js';
import { LoginPage } from './pages/LoginPage.js';
import { CourseListPage } from './pages/CourseListPage.js';
import { LessonListPage } from './pages/LessonListPage.js';
import { ExercisePage } from './pages/ExercisePage.js';
import { ResultPage } from './pages/ResultPage.js';
import type { WorkflowStateId } from '@lumina/contracts';

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

export default function App() {
  const [state, setState] = useState<AppState>(initialAppState);

  const navigate = (page: AppPage, nextState?: WorkflowStateId) => {
    setState((prev) => ({
      ...prev,
      currentPage: page,
      currentState: nextState ?? prev.currentState,
      goalState: {
        ...prev.goalState,
        currentState: nextState ?? prev.currentState,
      },
    }));
  };

  const handleLogin = (email: string) => {
    setState((prev) => ({
      ...prev,
      currentPage: 'courses',
      currentState: 'course-select',
      isLoggedIn: true,
      user: {
        name: email.split('@')[0] ?? 'User',
        email,
        avatar: (email[0] ?? 'U').toUpperCase(),
      },
      goalState: {
        currentState: 'course-select',
        context: {},
      },
    }));
  };

  const handleSelectCourse = (course: Course) => {
    setState((prev) => ({
      ...prev,
      currentPage: 'lessons',
      currentState: 'lesson-select',
      selectedCourse: course,
      goalState: {
        currentState: 'lesson-select',
        context: {
          ...prev.goalState.context,
          courseId: course.id,
        },
      },
    }));
  };

  const handleSelectLesson = (lesson: Lesson) => {
    const page: AppPage = lesson.type === 'exercise' ? 'exercise' : 'material';
    const stateId = lesson.type === 'exercise' ? 'submit-proof' : 'read-material';
    setState((prev) => ({
      ...prev,
      currentPage: page,
      currentState: stateId,
      selectedLesson: lesson,
      goalState: {
        ...prev.goalState,
        currentState: stateId,
        context: {
          ...prev.goalState.context,
          lessonId: lesson.id,
        },
      },
    }));
  };

  const handleSubmitProof = () => {
    setState((prev) => ({
      ...prev,
      currentPage: 'result',
      currentState: 'result',
      goalState: {
        ...prev.goalState,
        currentState: 'result',
      },
    }));
  };

  const handleRestart = () => {
    setState(initialAppState);
  };

  const currentStateIndex = WORKFLOW_STATES.findIndex((s) => s.state === state.currentState);
  const isLoggedIn = state.isLoggedIn;

  const renderPage = () => {
    switch (state.currentPage) {
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

