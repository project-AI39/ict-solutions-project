import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "DEV_SECRET_KEY";

/**
 * 標準 JWT ペイロード型（sub = subject が標準クレーム）
 */
type TokenPayload = {
  sub: string;
  iat?: number;
  exp?: number;
};

/**
 * リクエストから JWT を検証してユーザーIDを取得する（sub クレームを使用）
 * @param req NextRequest オブジェクト
 * @returns ユーザーID (string) または null（未認証 or 無効トークン）
 */
export function getUserIdFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload.sub || null;
  } catch (err) {
    // 署名検証失敗、期限切れ、形式不正など
    console.warn("[auth] JWT verify failed:", (err as Error)?.message);
    return null;
  }
}

/**
 * ユーザーIDから JWT を生成する（sub クレーム使用）
 * @param userId ユーザーの一意ID
 * @returns 署名済み JWT 文字列
 */
export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}
