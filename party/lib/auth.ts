import * as jose from "jose";

export interface WsTokenPayload extends jose.JWTPayload {
  userId: string;
  name: string;
  isBanned: boolean;
}

export async function verifyWsToken(token: string, env: Record<string, unknown>): Promise<WsTokenPayload | null> {
  try {
    const secretStr = env.WS_JWT_SECRET as string | undefined;
    if (!secretStr) {
      console.error("[PartyKit Auth] WS_JWT_SECRET is not set");
      return null;
    }
    const secret = new TextEncoder().encode(secretStr);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as WsTokenPayload;
  } catch (err) {
    return null;
  }
}
