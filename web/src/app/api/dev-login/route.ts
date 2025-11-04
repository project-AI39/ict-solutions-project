import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "DEV_SECRET_KEY";

export async function POST(req: NextRequest) {
  const { userId = "usr_1" } = await req.json().catch(() => ({}));
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });

  const res = NextResponse.json({ ok: true, userId });
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
