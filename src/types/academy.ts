export type UserRole = 'child' | 'parent' | 'team';
export type AgeGroup = '5-8' | '9-12';
export type LessonStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface AcademyYear {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
}

export interface LearningJourney {
  id: string;
  academyYearId: string;
  ageGroup: AgeGroup;
  title: string;
  description?: string;
  position: number;
  lessonIds: string[];
}

export type LessonStepType =
  | 'start'
  | 'discover'
  | 'explain'
  | 'quiz'
  | 'challenge';

export interface LessonStep {
  id: string;
  type: LessonStepType;
  title?: string;
  content?: string;
  position: number;
}

export interface Lesson {
  id: string;
  journeyId: string;
  ageGroup: AgeGroup;
  title: string;
  status: LessonStatus;
  publishAt?: string;
  replayUrl?: string;
  zoomUrl?: string;
  steps: LessonStep[];
}

export interface ChildProfile {
  id: string;
  parentId: string;
  displayName: string;
  ageGroup: AgeGroup;
  avatarKey: string;
}

export interface LiveSession {
  id: string;
  lessonId: string;
  startsAt: string;
  endsAt: string;
  meetingUrl?: string;
}

export interface Badge {
  id: string;
  title: string;
  description?: string;
  iconKey: string;
}

export interface ProgressRecord {
  childId: string;
  lessonId: string;
  completedStepIds: string[];
  completedAt?: string;
  awardedBadgeIds: string[];
}

export interface Submission {
  id: string;
  childId: string;
  lessonId: string;
  kind: 'confirmation' | 'text' | 'audio' | 'image';
  value?: string;
  submittedAt: string;
}

export const emptyAcademyData = {
  academyYears: [] as AcademyYear[],
  journeys: [] as LearningJourney[],
  lessons: [] as Lesson[],
  children: [] as ChildProfile[],
  sessions: [] as LiveSession[],
  badges: [] as Badge[],
  progress: [] as ProgressRecord[],
  submissions: [] as Submission[],
};

