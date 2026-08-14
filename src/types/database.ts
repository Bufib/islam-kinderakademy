export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DatabaseRole = 'parent' | 'teacher' | 'admin';
export type AgeGroup = '5-8' | '9-12';
export type LessonStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type LessonStepType = 'start' | 'discover' | 'explain' | 'quiz' | 'challenge';
export type LiveSessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type SubmissionType = 'confirmation' | 'text' | 'audio' | 'image';
export type MediaType = 'image' | 'audio' | 'video' | 'document';
export type MessageAudience = 'all' | 'profile' | 'group';

export type ProfileRow = {
  id: number;
  auth_user_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type UserRoleRow = {
  id: number;
  profile_id: number;
  role: DatabaseRole;
  created_at: string;
};

export type AcademyYearRow = {
  id: number;
  title: string;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
  created_at: string;
};

export type ChildRow = {
  id: number;
  parent_profile_id: number;
  display_name: string;
  birth_date: string | null;
  age_group: AgeGroup;
  avatar_key: string | null;
  created_at: string;
};

export type LearningJourneyRow = {
  id: number;
  academy_year_id: number;
  age_group: AgeGroup;
  title: string;
  description: string | null;
  position: number;
  is_published: boolean;
  created_at: string;
};

export type LessonRow = {
  id: number;
  learning_journey_id: number;
  title: string;
  description: string | null;
  status: LessonStatus;
  position: number;
  publish_at: string | null;
  replay_url: string | null;
  created_at: string;
};

export type LessonStepRow = {
  id: number;
  lesson_id: number;
  step_type: LessonStepType;
  title: string | null;
  content: Json;
  position: number;
  created_at: string;
};

export type GroupRow = {
  id: number;
  academy_year_id: number;
  teacher_profile_id: number | null;
  name: string;
  age_group: AgeGroup;
  created_at: string;
};

export type GroupMemberRow = {
  id: number;
  group_id: number;
  child_id: number;
  created_at: string;
};

export type LiveSessionRow = {
  id: number;
  lesson_id: number;
  group_id: number | null;
  title: string | null;
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  replay_url: string | null;
  status: LiveSessionStatus;
  created_at: string;
};

export type ChildLessonProgressRow = {
  id: number;
  child_id: number;
  lesson_id: number;
  status: ProgressStatus;
  progress_percent: number;
  last_opened_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type ChildStepProgressRow = {
  id: number;
  child_id: number;
  lesson_step_id: number;
  completed_at: string;
  created_at: string;
};

export type SubmissionRow = {
  id: number;
  child_id: number;
  lesson_id: number;
  lesson_step_id: number | null;
  submission_type: SubmissionType;
  text_value: string | null;
  storage_path: string | null;
  submitted_at: string;
  created_at: string;
};

export type BadgeRow = {
  id: number;
  title: string;
  description: string | null;
  icon_key: string;
  created_at: string;
};

export type ChildBadgeRow = {
  id: number;
  child_id: number;
  badge_id: number;
  lesson_id: number | null;
  awarded_at: string;
  created_at: string;
};

export type MediaAssetRow = {
  id: number;
  uploaded_by_profile_id: number | null;
  media_type: MediaType;
  bucket_name: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type MessageRow = {
  id: number;
  sender_profile_id: number | null;
  recipient_profile_id: number | null;
  group_id: number | null;
  audience: MessageAudience;
  subject: string;
  body: string;
  published_at: string | null;
  created_at: string;
};

export type AcademyData = {
  profiles: ProfileRow[];
  userRoles: UserRoleRow[];
  academyYears: AcademyYearRow[];
  children: ChildRow[];
  journeys: LearningJourneyRow[];
  lessons: LessonRow[];
  lessonSteps: LessonStepRow[];
  groups: GroupRow[];
  groupMembers: GroupMemberRow[];
  liveSessions: LiveSessionRow[];
  lessonProgress: ChildLessonProgressRow[];
  stepProgress: ChildStepProgressRow[];
  submissions: SubmissionRow[];
  badges: BadgeRow[];
  childBadges: ChildBadgeRow[];
  mediaAssets: MediaAssetRow[];
  messages: MessageRow[];
};

export const emptyDatabaseData: AcademyData = {
  profiles: [],
  userRoles: [],
  academyYears: [],
  children: [],
  journeys: [],
  lessons: [],
  lessonSteps: [],
  groups: [],
  groupMembers: [],
  liveSessions: [],
  lessonProgress: [],
  stepProgress: [],
  submissions: [],
  badges: [],
  childBadges: [],
  mediaAssets: [],
  messages: [],
};

export type AcademyTableRowMap = {
  profiles: ProfileRow;
  user_roles: UserRoleRow;
  academy_years: AcademyYearRow;
  children: ChildRow;
  learning_journeys: LearningJourneyRow;
  lessons: LessonRow;
  lesson_steps: LessonStepRow;
  groups: GroupRow;
  group_members: GroupMemberRow;
  live_sessions: LiveSessionRow;
  child_lesson_progress: ChildLessonProgressRow;
  child_step_progress: ChildStepProgressRow;
  submissions: SubmissionRow;
  badges: BadgeRow;
  child_badges: ChildBadgeRow;
  media_assets: MediaAssetRow;
  messages: MessageRow;
};

export type AcademyTableName = keyof AcademyTableRowMap;
export type AcademyInsert<K extends AcademyTableName> = Partial<
  Omit<AcademyTableRowMap[K], 'id' | 'created_at'>
>;
export type AcademyUpdate<K extends AcademyTableName> = Partial<
  Omit<AcademyTableRowMap[K], 'id' | 'created_at'>
>;

export type LessonEditorInput = {
  id?: number;
  learningJourneyId: number;
  title: string;
  description?: string;
  status: LessonStatus;
  position: number;
  publishAt?: string | null;
  replayUrl?: string | null;
  steps: Array<{
    stepType: LessonStepType;
    title?: string;
    text?: string;
    position: number;
  }>;
  liveSession?: {
    id?: number;
    groupId?: number | null;
    title?: string;
    startsAt: string;
    endsAt: string;
    meetingUrl?: string;
  } | null;
};
