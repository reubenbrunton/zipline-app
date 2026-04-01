export const TEAM_OWNER_EMAIL = "reuben@ziplinemarketing.com.au";

export function isTeamOwnerEmail(email?: string | null): boolean {
  return (email ?? "").trim().toLowerCase() === TEAM_OWNER_EMAIL;
}
