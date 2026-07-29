import { Prisma, UserRole } from "@prisma/client";

import { apiError, apiSuccess } from "@/lib/api-response";
import { registrationSchema } from "@/lib/auth-validation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createWorkspaceSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_SLUG_ATTEMPTS = 3;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return apiError(
      "INVALID_CONTENT_TYPE",
      "Content-Type must be application/json.",
      415,
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return apiError("PAYLOAD_TOO_LARGE", "Registration payload is too large.", 413);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must contain valid JSON.", 400);
  }

  const parsedRegistration = registrationSchema.safeParse(payload);

  if (!parsedRegistration.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Review the highlighted registration fields.",
      422,
      parsedRegistration.error.flatten().fieldErrors,
    );
  }

  const { name, workspaceName, email, password } = parsedRegistration.data;

  const existingUser = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return apiError(
      "EMAIL_ALREADY_EXISTS",
      "An account already exists for this email address.",
      409,
      {
        email: ["An account already exists for this email address."],
      },
    );
  }

  const passwordHash = await hashPassword(password);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    try {
      const workspace = await db.workspace.create({
        data: {
          name: workspaceName,
          slug: createWorkspaceSlug(workspaceName),
          users: {
            create: {
              name,
              email,
              passwordHash,
              role: UserRole.ADMIN,
              isActive: true,
            },
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          users: {
            take: 1,
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      const createdUser = workspace.users[0];

      if (!createdUser) {
        return apiError(
          "REGISTRATION_FAILED",
          "The account could not be created. Please try again.",
          500,
        );
      }

      return apiSuccess(
        {
          user: createdUser,
          workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
          },
        },
        201,
      );
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.map(String)
          : [String(error.meta?.target ?? "")];

        if (target.some((field) => field.includes("email"))) {
          return apiError(
            "EMAIL_ALREADY_EXISTS",
            "An account already exists for this email address.",
            409,
            {
              email: ["An account already exists for this email address."],
            },
          );
        }

        if (target.some((field) => field.includes("slug")) && attempt < MAX_SLUG_ATTEMPTS - 1) {
          continue;
        }
      }

      console.error("Registration failed.", error);

      return apiError(
        "REGISTRATION_FAILED",
        "The account could not be created. Please try again.",
        500,
      );
    }
  }

  return apiError(
    "REGISTRATION_FAILED",
    "The workspace could not be created. Please try again.",
    500,
  );
}