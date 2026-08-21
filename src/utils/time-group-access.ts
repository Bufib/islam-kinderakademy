import type { AcademyData, GroupMembershipStatus, GroupRow } from '@/types/database';

type TimeGroupAccessData = Pick<
  AcademyData,
  'academyYears' | 'groupMembers' | 'groups'
>;

export function findActiveTimeGroupForChild(
  data: TimeGroupAccessData,
  childId: number,
  status: GroupMembershipStatus
): GroupRow | null {
  const activeYearIds = new Set(
    data.academyYears
      .filter((year) => year.is_active)
      .map((year) => year.id)
  );

  const memberships = data.groupMembers
    .filter(
      (membership) =>
        membership.child_id === childId &&
        membership.membership_status === status
    )
    .sort((a, b) => b.requested_at.localeCompare(a.requested_at));

  for (const membership of memberships) {
    const timeGroup = data.groups.find(
      (group) =>
        group.id === membership.group_id &&
        activeYearIds.has(group.academy_year_id)
    );

    if (timeGroup) return timeGroup;
  }

  return null;
}

export function hasApprovedTimeGroup(
  data: TimeGroupAccessData,
  childId: number
) {
  return Boolean(findActiveTimeGroupForChild(data, childId, 'approved'));
}
