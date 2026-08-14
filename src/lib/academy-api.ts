import {
  AcademyData,
  AcademyInsert,
  AcademyTableName,
  AcademyTableRowMap,
  AcademyUpdate,
  AdminAccountSummary,
  ChildLessonProgressRow,
  LessonEditorInput,
  MediaAssetRow,
  MediaType,
  emptyDatabaseData,
} from '@/types/database';
import { supabase } from '@/lib/supabase';

export class AcademyApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AcademyApiError';
  }
}

function client() {
  if (!supabase) throw new AcademyApiError('Supabase ist noch nicht konfiguriert.');
  return supabase;
}

function fail(error: { message: string } | null) {
  if (error) throw new AcademyApiError(error.message);
}

export async function ensureCurrentProfileId() {
  const { data, error } = await client().rpc('ensure_current_profile');
  fail(error);
  const profileId = Number(data);
  if (!Number.isFinite(profileId)) {
    throw new AcademyApiError('Das Supabase-Profil konnte nicht bereitgestellt werden.');
  }
  return profileId;
}

export async function listAdminAccounts() {
  const { data, error } = await client().rpc('list_admin_accounts');
  fail(error);
  return (data ?? []) as AdminAccountSummary[];
}

export async function setProfilePrimaryRole(
  profileId: number,
  role: 'parent' | 'teacher' | 'admin'
) {
  const { error } = await client().rpc('set_profile_primary_role', {
    target_profile_id: profileId,
    next_role: role,
  });
  fail(error);
}

async function selectTable<T>(table: AcademyTableName, order: string, ascending = true) {
  const { data, error } = await client().from(table).select('*').order(order, { ascending });
  fail(error);
  return (data ?? []) as T[];
}

export async function loadAcademyData(): Promise<AcademyData> {
  if (!supabase) return emptyDatabaseData;

  const [
    profiles,
    userRoles,
    academyYears,
    children,
    journeys,
    lessons,
    lessonSteps,
    groups,
    groupMembers,
    liveSessions,
    lessonProgress,
    stepProgress,
    submissions,
    badges,
    childBadges,
    mediaAssets,
    messages,
  ] = await Promise.all([
    selectTable<AcademyData['profiles'][number]>('profiles', 'display_name'),
    selectTable<AcademyData['userRoles'][number]>('user_roles', 'created_at'),
    selectTable<AcademyData['academyYears'][number]>('academy_years', 'starts_on', false),
    selectTable<AcademyData['children'][number]>('children', 'display_name'),
    selectTable<AcademyData['journeys'][number]>('learning_journeys', 'position'),
    selectTable<AcademyData['lessons'][number]>('lessons', 'position'),
    selectTable<AcademyData['lessonSteps'][number]>('lesson_steps', 'position'),
    selectTable<AcademyData['groups'][number]>('groups', 'name'),
    selectTable<AcademyData['groupMembers'][number]>('group_members', 'created_at'),
    selectTable<AcademyData['liveSessions'][number]>('live_sessions', 'starts_at'),
    selectTable<AcademyData['lessonProgress'][number]>('child_lesson_progress', 'created_at'),
    selectTable<AcademyData['stepProgress'][number]>('child_step_progress', 'created_at'),
    selectTable<AcademyData['submissions'][number]>('submissions', 'submitted_at', false),
    selectTable<AcademyData['badges'][number]>('badges', 'title'),
    selectTable<AcademyData['childBadges'][number]>('child_badges', 'awarded_at', false),
    selectTable<AcademyData['mediaAssets'][number]>('media_assets', 'created_at', false),
    selectTable<AcademyData['messages'][number]>('messages', 'created_at', false),
  ]);

  return {
    profiles,
    userRoles,
    academyYears,
    children,
    journeys,
    lessons,
    lessonSteps,
    groups,
    groupMembers,
    liveSessions,
    lessonProgress,
    stepProgress,
    submissions,
    badges,
    childBadges,
    mediaAssets,
    messages,
  };
}

export async function createRecord<K extends AcademyTableName>(
  table: K,
  values: AcademyInsert<K>
): Promise<AcademyTableRowMap[K]> {
  const { data, error } = await client().from(table).insert(values as never).select('*').single();
  fail(error);
  return data as AcademyTableRowMap[K];
}

export async function updateRecord<K extends AcademyTableName>(
  table: K,
  id: number,
  values: AcademyUpdate<K>
): Promise<AcademyTableRowMap[K]> {
  const { data, error } = await client()
    .from(table)
    .update(values as never)
    .eq('id', id)
    .select('*')
    .single();
  fail(error);
  return data as AcademyTableRowMap[K];
}

export async function deleteRecord(table: AcademyTableName, id: number) {
  const { error } = await client().from(table).delete().eq('id', id);
  fail(error);
}

export async function replaceGroupMembers(groupId: number, childIds: number[]) {
  const db = client();
  const { error: deleteError } = await db.from('group_members').delete().eq('group_id', groupId);
  fail(deleteError);

  if (childIds.length > 0) {
    const { error: insertError } = await db
      .from('group_members')
      .insert(childIds.map((childId) => ({ group_id: groupId, child_id: childId })));
    fail(insertError);
  }
}

export async function saveLesson(input: LessonEditorInput) {
  const lessonValues = {
    learning_journey_id: input.learningJourneyId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status,
    position: input.position,
    publish_at: input.publishAt || null,
    replay_url: input.replayUrl?.trim() || null,
  };

  const lesson = input.id
    ? await updateRecord('lessons', input.id, lessonValues)
    : await createRecord('lessons', lessonValues);

  const stepRows = input.steps.map((step) => ({
    lesson_id: lesson.id,
    step_type: step.stepType,
    title: step.title?.trim() || null,
    content: { text: step.text?.trim() || '' },
    position: step.position,
  }));

  const { error: stepError } = await client()
    .from('lesson_steps')
    .upsert(stepRows, { onConflict: 'lesson_id,position' });
  fail(stepError);

  if (input.liveSession) {
    const sessionValues = {
      lesson_id: lesson.id,
      group_id: input.liveSession.groupId ?? null,
      title: input.liveSession.title?.trim() || lesson.title,
      starts_at: input.liveSession.startsAt,
      ends_at: input.liveSession.endsAt,
      meeting_url: input.liveSession.meetingUrl?.trim() || null,
      status: 'scheduled' as const,
    };

    if (input.liveSession.id) {
      await updateRecord('live_sessions', input.liveSession.id, sessionValues);
    } else {
      await createRecord('live_sessions', sessionValues);
    }
  }

  return lesson;
}

async function refreshLessonProgress(childId: number, lessonId: number) {
  const db = client();
  const { data: steps, error: stepsError } = await db
    .from('lesson_steps')
    .select('id')
    .eq('lesson_id', lessonId);
  fail(stepsError);

  const stepIds = (steps ?? []).map((step) => step.id as number);
  let completedCount = 0;

  if (stepIds.length > 0) {
    const { count, error: completedError } = await db
      .from('child_step_progress')
      .select('id', { count: 'exact', head: true })
      .eq('child_id', childId)
      .in('lesson_step_id', stepIds);
    fail(completedError);
    completedCount = count ?? 0;
  }

  const percent = stepIds.length === 0 ? 0 : Math.round((completedCount / stepIds.length) * 100);
  const progress: Partial<ChildLessonProgressRow> = {
    child_id: childId,
    lesson_id: lessonId,
    status: percent === 100 ? 'completed' : percent > 0 ? 'in_progress' : 'not_started',
    progress_percent: percent,
    last_opened_at: new Date().toISOString(),
    completed_at: percent === 100 ? new Date().toISOString() : null,
  };

  const { error } = await db
    .from('child_lesson_progress')
    .upsert(progress, { onConflict: 'child_id,lesson_id' });
  fail(error);
}

export async function setStepCompleted(
  childId: number,
  lessonId: number,
  lessonStepId: number,
  completed: boolean
) {
  const db = client();

  if (completed) {
    const { error } = await db.from('child_step_progress').upsert(
      { child_id: childId, lesson_step_id: lessonStepId },
      { onConflict: 'child_id,lesson_step_id' }
    );
    fail(error);
  } else {
    const { error } = await db
      .from('child_step_progress')
      .delete()
      .eq('child_id', childId)
      .eq('lesson_step_id', lessonStepId);
    fail(error);
  }

  await refreshLessonProgress(childId, lessonId);
}

export async function saveTextSubmission(
  childId: number,
  lessonId: number,
  lessonStepId: number,
  text: string
) {
  const existing = await client()
    .from('submissions')
    .select('id')
    .eq('child_id', childId)
    .eq('lesson_step_id', lessonStepId)
    .eq('submission_type', 'text')
    .maybeSingle();
  fail(existing.error);

  if (existing.data?.id) {
    return updateRecord('submissions', existing.data.id as number, {
      text_value: text.trim(),
      submitted_at: new Date().toISOString(),
    });
  }

  return createRecord('submissions', {
    child_id: childId,
    lesson_id: lessonId,
    lesson_step_id: lessonStepId,
    submission_type: 'text',
    text_value: text.trim(),
    storage_path: null,
    submitted_at: new Date().toISOString(),
  });
}

export async function saveConfirmationSubmission(
  childId: number,
  lessonId: number,
  lessonStepId: number,
  text?: string
) {
  const existing = await client()
    .from('submissions')
    .select('id')
    .eq('child_id', childId)
    .eq('lesson_step_id', lessonStepId)
    .eq('submission_type', 'confirmation')
    .limit(1)
    .maybeSingle();
  fail(existing.error);

  const values = {
    text_value: text?.trim() || null,
    submitted_at: new Date().toISOString(),
  };

  if (existing.data?.id) {
    return updateRecord('submissions', existing.data.id as number, values);
  }

  return createRecord('submissions', {
    child_id: childId,
    lesson_id: lessonId,
    lesson_step_id: lessonStepId,
    submission_type: 'confirmation',
    storage_path: null,
    ...values,
  });
}

export async function uploadMediaAsset(input: {
  profileId: number;
  fileName: string;
  mimeType: string | null;
  size: number | null;
  data: ArrayBuffer;
}): Promise<MediaAssetRow> {
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${input.profileId}/${Date.now()}-${safeName}`;
  const mediaType: MediaType = input.mimeType?.startsWith('image/')
    ? 'image'
    : input.mimeType?.startsWith('audio/')
      ? 'audio'
      : input.mimeType?.startsWith('video/')
        ? 'video'
        : 'document';

  const { error: uploadError } = await client().storage
    .from('academy-media')
    .upload(path, input.data, { contentType: input.mimeType ?? undefined, upsert: false });
  fail(uploadError);

  try {
    return await createRecord('media_assets', {
      uploaded_by_profile_id: input.profileId,
      media_type: mediaType,
      bucket_name: 'academy-media',
      storage_path: path,
      file_name: input.fileName,
      mime_type: input.mimeType,
      size_bytes: input.size,
    });
  } catch (error) {
    await client().storage.from('academy-media').remove([path]);
    throw error;
  }
}

export async function getMediaSignedUrl(asset: MediaAssetRow) {
  const { data, error } = await client().storage
    .from(asset.bucket_name)
    .createSignedUrl(asset.storage_path, 60 * 10);
  fail(error);
  return data?.signedUrl ?? null;
}

export async function deleteMediaAsset(asset: MediaAssetRow) {
  const { error: storageError } = await client().storage
    .from(asset.bucket_name)
    .remove([asset.storage_path]);
  fail(storageError);
  await deleteRecord('media_assets', asset.id);
}
