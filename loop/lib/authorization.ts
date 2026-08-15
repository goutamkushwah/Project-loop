//import "server-only";

import type { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { apiError } from "@/lib/api-response";
import { getCurrentApiUser, requireCurrentUser, type CurrentUser } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/rbac";
import type { ApiErrorResponse } from "@/types/api";

export type ApiAuthorizationResult =
  | {
      ok: true;
      user: CurrentUser;
    }
  | {
      ok: false;
      response: NextResponse<ApiErrorResponse>;
    };

export async function authorizeApi(permission: Permission): Promise<ApiAuthorizationResult> {
  const user = await getCurrentApiUser();

  if (!user) {
    return {
      ok: false,
      response: apiError("UNAUTHENTICATED", "Authentication is required.", 401),
    };
  }

  if (!hasPermission(user.role, permission)) {
    return {
      ok: false,
      response: apiError(
        "FORBIDDEN",
        "Your role does not permit this workspace action.",
        403,
      ),
    };
  }

  return {
    ok: true,
    user,
  };
}

export async function requirePagePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireCurrentUser();

  if (!hasPermission(user.role, permission)) {
    redirect("/forbidden");
  }

  return user;
}