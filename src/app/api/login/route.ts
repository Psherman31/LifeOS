import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();
  const expected = process.env.LIFEOS_PASSCODE;
  if (!expected) {
    return NextResponse.json({ error: "LIFEOS_PASSCODE is not configured" }, { status: 500 });
  }
  if (typeof passcode !== "string" || passcode !== expected) {
    return NextResponse.json({ error: "That's not it — try again." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await authToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
