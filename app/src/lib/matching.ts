export interface MatchResult {
  sharedFieldIds: string[];
  score: number;
}

export function computeMatch(
  studentFieldIds: readonly string[],
  targetFieldIds: readonly string[]
): MatchResult {
  const studentSet = new Set(studentFieldIds);
  const targetSet = new Set(targetFieldIds);
  const sharedFieldIds = studentFieldIds.filter((id) => targetSet.has(id));
  const unionSize = new Set([...studentSet, ...targetSet]).size;
  return {
    sharedFieldIds,
    score: unionSize === 0 ? 0 : sharedFieldIds.length / unionSize,
  };
}

export function sortByMatch<T>(
  items: readonly T[],
  studentFieldIds: readonly string[],
  getFieldIds: (item: T) => string[]
): (T & { match: MatchResult })[] {
  return items
    .map((item) => ({
      ...item,
      match: computeMatch(studentFieldIds, getFieldIds(item)),
    }))
    .sort((a, b) => b.match.score - a.match.score);
}
