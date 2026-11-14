import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { getSession } from "./auth";
import type { Role } from "./constants";
import type { SessionPayload } from "./jwt";
import { fieldErrors } from "./validations";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, errors?: Record<string, string>) {
  return NextResponse.json({ error: message, errors }, { status });
}

export function validationFailed(error: ZodError) {
  return fail("Please correct the highlighted fields.", 422, fieldErrors(error));
}

type Guard = { session: SessionPayload; response?: never } | { session?: never; response: NextResponse };

/** Route-handler guard: ensures a valid session (and optionally a role). */
export async function guard(roles?: Role[]): Promise<Guard> {
  const session = await getSession();
  if (!session) return { response: fail("Please log in to continue.", 401) };
  if (roles && !roles.includes(session.role)) {
    return { response: fail("You do not have permission to do that.", 403) };
  }
  return { session };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
