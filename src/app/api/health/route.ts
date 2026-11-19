import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "askapple-forum",
    time: new Date().toISOString(),
  });
}
