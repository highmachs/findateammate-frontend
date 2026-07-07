import * as jose from "jose";

export interface WsTokenPayload extends jose.JWTPayload {
  userId: string;
  name: string;
  isBanned: boolean;
}

export async function verifyWsToken(token: string): Promise<WsTokenPayload | null> {
  try {
    const secretStr = process.env.WS_JWT_SECRET;
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
