// Pure (no Prisma) helpers — safe to import from edge contexts.

export function getAllowedUsernames(): string[] {
  return (process.env.AUTH_ALLOWED_USERNAMES ?? "")
    .split(",")
    .map((u) => u.trim().toLowerCase())
    .filter(Boolean);
}

export function isUsernameAllowed(username: string | null | undefined): boolean {
  if (!username) return false;
  return getAllowedUsernames().includes(username.toLowerCase());
}

export function pickColorFor(username: string): string {
  const idx = getAllowedUsernames().indexOf(username.toLowerCase());
  return idx === 0 ? "indigo" : "amber";
}

// Pretty display name derived from a username (capitalize first letter).
export function displayNameFor(username: string): string {
  if (!username) return "";
  return username.charAt(0).toUpperCase() + username.slice(1);
}
