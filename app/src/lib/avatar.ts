export function getAvatarUrl(firstName: string, lastName: string): string {
  const seed = encodeURIComponent(`${firstName}${lastName}`);
  return `https://api.dicebear.com/9.x/personas/svg?seed=${seed}`;
}
