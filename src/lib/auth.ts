// Single-user passcode auth. The session cookie holds a SHA-256 digest of
// the passcode plus a fixed salt; the middleware recomputes and compares.

export const AUTH_COOKIE = "lifeos_auth";
const SALT = "lifeos-auth-v1";

export async function authToken(passcode: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}:${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidToken(token: string | undefined): Promise<boolean> {
  const passcode = process.env.LIFEOS_PASSCODE;
  if (!passcode || !token) return false;
  return token === (await authToken(passcode));
}
