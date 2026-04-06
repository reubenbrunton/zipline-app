export const TEAM_ADMIN_EMAILS = [
  "reuben@ziplinemarketing.com.au",
  "oli@ziplinemarketing.com.au",
];

export function isTeamOwnerEmail(email?: string | null): boolean {
  return TEAM_ADMIN_EMAILS.includes((email ?? "").trim().toLowerCase());
}
