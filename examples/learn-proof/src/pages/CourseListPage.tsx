// apps/learn-proof-runtime/src/pages/CourseListPage.tsx

import React from 'react';
import type { Course } from '../store/app-store';

interface CourseListPageProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
}

export function CourseListPage({ courses, onSelectCourse }: CourseListPageProps) {
  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <div>
          <h2>My Courses</h2>
          <p style={{ marginTop: 4, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            {courses.length} courses available · Continue learning
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <span className="badge badge-lumina">⚡ AI-Assisted</span>
        </div>
      </div>

      <div className="course-grid">
        {courses.map((course) => {
          const progress = Math.round((course.completedLessons / course.lessonCount) * 100);
          return (
            <button
              key={course.id}
              id={`course-${course.id}`}
              className="course-card"
              onClick={() => onSelectCourse(course)}
              aria-label={course.title}
              data-lumina-state="course-select"
              data-lumina-semantic="action-button"
              data-course-id={course.id}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div className="course-card-icon">{course.icon}</div>
                <span className={`badge ${
                  course.difficulty === 'Beginner' ? 'badge-success'
                  : course.difficulty === 'Intermediate' ? 'badge-warning'
                  : 'badge-error'
                }`}>
                  {course.difficulty}
                </span>
              </div>

              <div>
                <div className="course-card-title">{course.title}</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  {course.description}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginTop: 'auto' }}>
                <div className="course-progress-bar">
                  <div className="course-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="course-card-meta">
                  <span>{course.completedLessons}/{course.lessonCount} lessons</span>
                  <span style={{ marginLeft: 'auto' }}>{progress}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
