import { SignJWT, jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "starfall-default-fallback-super-secret-key-32-chars"
);

export interface SessionPayload {
  playerId: string;
  nickname: string;
}

/**
 * Signs an anonymous or registered player session JWT.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}

/**
 * Verifies player session JWT.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      playerId: payload.playerId as string,
      nickname: payload.nickname as string,
    };
  } catch {
    return null;
  }
}
