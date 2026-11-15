// Edge-safe JWT helpers (used by both middleware and server code).
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./constants";

export const AUTH_COOKIE = "efie_token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  sub: string;
  role: Role;
  name: string;
  email: string;
  /** The user's sessionVersion when this token was issued; a mismatch means it was revoked. */
  sv: number;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or too short. Set a value of at least 32 characters in .env");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name, email: payload.email, sv: payload.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/**
 * Checks the signature and expiry only. The middleware uses this as a fast pre-check;
 * server code must use getSession() (src/lib/auth.ts), which also checks the token wasn't revoked.
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.role !== "string") return null;
    return {
      sub: payload.sub,
      role: payload.role as Role,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      // Tokens issued before session versions existed count as version 0.
      sv: typeof payload.sv === "number" ? payload.sv : 0,
    };
  } catch {
    return null;
  }
}
