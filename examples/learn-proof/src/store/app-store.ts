import type { WorkflowStateId, GoalState } from '@lumina/contracts';

export type AppPage =
  | 'login'
  | 'courses'
  | 'lessons'
  | 'material'
  | 'exercise'
  | 'result';

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessonCount: number;
  completedLessons: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  duration: string;
  completed: boolean;
  type: 'reading' | 'exercise';
}

export interface AppState {
  currentPage: AppPage;
  currentState: WorkflowStateId;
  goalState: GoalState;
  selectedCourse: Course | null;
  selectedLesson: Lesson | null;
  user: { name: string; email: string; avatar: string } | null;
  isLoggedIn: boolean;
}

export const MOCK_COURSES: Course[] = [
  {
    id: 'blockchain-101',
    title: 'Introduction to Blockchain',
    description: 'Learn the fundamentals of distributed ledgers, consensus mechanisms, and cryptographic hashing.',
    icon: '⛓️',
    lessonCount: 8,
    completedLessons: 3,
    difficulty: 'Beginner',
  },
  {
    id: 'zkp-101',
    title: 'Zero Knowledge Proofs',
    description: 'Master the mathematics and application of ZK proofs in modern cryptographic systems.',
    icon: '🔮',
    lessonCount: 12,
    completedLessons: 0,
    difficulty: 'Advanced',
  },
  {
    id: 'smart-contracts-adv',
    title: 'Advanced Smart Contracts',
    description: 'Build production-ready smart contracts with formal verification and security auditing.',
    icon: '📜',
    lessonCount: 10,
    completedLessons: 10,
    difficulty: 'Intermediate',
  },
  {
    id: 'defi-protocols',
    title: 'DeFi Protocol Design',
    description: 'Design and analyze decentralized finance protocols including AMMs, lending, and derivatives.',
    icon: '💎',
    lessonCount: 14,
    completedLessons: 7,
    difficulty: 'Advanced',
  },
];

export const MOCK_LESSONS: Lesson[] = [
  { id: 'lesson-01', courseId: 'blockchain-101', title: 'What is a Blockchain?', duration: '15 min', completed: true, type: 'reading' },
  { id: 'lesson-02', courseId: 'blockchain-101', title: 'Cryptographic Hash Functions', duration: '20 min', completed: true, type: 'reading' },
  { id: 'lesson-03', courseId: 'blockchain-101', title: 'Hash Function Exercise', duration: '30 min', completed: false, type: 'exercise' },
  { id: 'lesson-04', courseId: 'blockchain-101', title: 'Merkle Trees', duration: '25 min', completed: false, type: 'reading' },
  { id: 'lesson-05', courseId: 'blockchain-101', title: 'Consensus Mechanisms', duration: '35 min', completed: false, type: 'reading' },
];

export const initialAppState: AppState = {
  currentPage: 'login',
  currentState: 'login',
  goalState: {
    currentState: 'login',
    context: {},
  },
  selectedCourse: null,
  selectedLesson: null,
  user: null,
  isLoggedIn: false,
};
