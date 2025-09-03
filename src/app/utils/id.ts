export function generateId(prefix = ''): string {
  // Simple RFC4122-like random id without external deps
  return (
    prefix +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 9)
  );
}
