const USERNAME_DOMAIN = "aurageist.local";

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${USERNAME_DOMAIN}`;
}

export function emailToUsername(email: string | null | undefined): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (domain !== USERNAME_DOMAIN) return null;
  return local;
}
