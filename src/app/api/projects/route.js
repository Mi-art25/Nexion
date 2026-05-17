import { NextResponse } from "next/server";
import { getSession } from "../../../lib/supabase";

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch projects logic
  return NextResponse.json({ projects: [] });
}

export async function POST(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Create project logic
  return NextResponse.json({ message: "Project created" }, { status: 201 });
}

export async function DELETE(request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Delete project logic
  return NextResponse.json({ message: "Project deleted" });
}