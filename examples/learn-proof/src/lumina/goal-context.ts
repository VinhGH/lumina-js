/** Learn Proof-specific context — extends generic GoalState.context */
export interface LearnProofContext {
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
}
