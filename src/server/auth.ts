import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE = "alma_session";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

function secret() {
  const s = process.env.ALMA_JWT_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ALMA_JWT_SECRET missing or too short");
    }
    return new TextEncoder().encode("alma-dev-secret-fallback-0123456789abcdef");
  }
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  sub: string; // userId
  email?: string | null;
  name?: string | null;
  role: string;
  guest: boolean;
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.sub) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true, preferences: true, creditWallet: true },
  });
  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    throw new AuthError("FORBIDDEN");
  }
  return user;
}

export class AuthError extends Error {
  code: "UNAUTHORIZED" | "FORBIDDEN";
  constructor(code: "UNAUTHORIZED" | "FORBIDDEN") {
    super(code);
    this.code = code;
  }
}
