// apps/learn-proof-runtime/src/pages/LessonListPage.tsx

import React from 'react';
import type { Course, Lesson } from '../store/app-store.js';

interface LessonListPageProps {
  course: Course;
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
  onBack: () => void;
}

export function LessonListPage({ course, lessons, onSelectLesson, onBack }: LessonListPageProps) {
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack} id="back-to-courses">
          ← Back
        </button>
        <div className="course-card-icon" style={{ width: 40, height: 40, fontSize: '1.25rem' }}>
          {course.icon}
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>{course.title}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {lessons.length} lessons · {course.difficulty}
          </p>
        </div>
      </div>

      <div className="lesson-list">
        {lessons.map((lesson, idx) => (
          <button
            key={lesson.id}
            id={`lesson-${lesson.id}`}
            className={`lesson-item ${lesson.completed ? 'completed' : ''}`}
            onClick={() => onSelectLesson(lesson)}
            aria-label={lesson.title}
            data-lumina-state="lesson-select"
            data-lumina-semantic="action-button"
            data-lesson-id={lesson.id}
          >
            <div className={`lesson-number ${lesson.completed ? 'completed' : ''}`}>
              {lesson.completed ? '✓' : idx + 1}
            </div>
            <div className="lesson-info">
              <div className="lesson-title">{lesson.title}</div>
              <div className="lesson-meta">
                {lesson.duration} · {lesson.type === 'exercise' ? '✏️ Exercise' : '📖 Reading'}
              </div>
            </div>
            {lesson.type === 'exercise' && (
              <span className="badge badge-brand" style={{ fontSize: '0.75rem' }}>
                Proof Required
              </span>
            )}
            {lesson.completed && (
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                Complete
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
