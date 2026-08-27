import type { DayIndex, PersonId, RunState } from './types';

/** Days covered for group-total purposes: practised days plus a spent token. */
export function coveredDays(state: RunState, personId: PersonId): Set<DayIndex> {
  const days = new Set<DayIndex>();
  for (const l of state.logs) {
    if (l.personId === personId && l.practised) days.add(l.day);
  }
  const token = state.tokens.find((t) => t.personId === personId);
  if (token?.spentOnDay != null) days.add(token.spentOnDay);
  return days;
}
