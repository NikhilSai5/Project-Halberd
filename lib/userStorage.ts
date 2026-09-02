export function userStorageKey(userId: string, key: string): string {
  return `halberd:user:${userId}:${key}`;
}
