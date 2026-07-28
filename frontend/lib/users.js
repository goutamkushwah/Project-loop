import bcrypt from "bcryptjs";

/**
 * DEMO-ONLY in-memory user store.
 *
 * This resets every time the server restarts, and won't work across
 * multiple server instances. It exists so the auth flow is runnable
 * out of the box.
 *
 * For production, swap this file's functions for real database calls
 * (Postgres + Prisma, MongoDB, Supabase, etc.) — keep the same
 * function names (findUserByEmail, createUser) so nothing else has
 * to change in the NextAuth config or the signup route.
 */
const users = [];

export async function findUserByEmail(email) {
  return users.find((u) => u.email === email.toLowerCase()) || null;
}

export async function createUser({ name, workspace, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: String(users.length + 1),
    name,
    workspace,
    email: email.toLowerCase(),
    passwordHash,
  };
  users.push(user);
  return user;
}

export async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.passwordHash);
}
