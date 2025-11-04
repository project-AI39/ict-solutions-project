import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { userId = "usr_1" } = await req.json().catch(() => ({}));
  const token = signToken(userId);

  const res = NextResponse.json({ ok: true, userId });
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
