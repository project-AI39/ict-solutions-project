import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "DEV_SECRET_KEY_CHANGE_ME";

type TokenPayload = { uid: string };

export function getUserIdFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded.uid;
  } catch {
    return null;
  }
}

export function signToken(uid: string) {
  return jwt.sign({ uid }, JWT_SECRET, { expiresIn: "7d" });
}
