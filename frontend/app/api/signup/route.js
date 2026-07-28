import { NextResponse } from "next/server";
import { createUser } from "@/lib/users";

export async function POST(request) {
  try {
    const { name, workspace, email, password } = await request.json();

    if (!name || !workspace || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await createUser({ name, workspace, email, password });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Something went wrong." },
      { status: 400 }
    );
  }
}
