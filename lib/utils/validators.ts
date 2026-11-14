export const GITHUB_USERNAME_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

/**
 * Validates GitHub login format (1-39 alphanumeric chars or single hyphens, no leading/trailing hyphen).
 */
export function isValidGitHubUsername(username: string): boolean {
  if (!username || typeof username !== "string") return false;
  return GITHUB_USERNAME_REGEX.test(username.trim());
}
