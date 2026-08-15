//import "server-only";

import { Prisma, type UserRole } from "@prisma/client";

import {
  createInvitationExpiry,
  createInvitationToken,
  hashInvitationToken,
} from "@/lib/invitations";
import type {
  InvitationAcceptInput,
  InvitationCreateInput,
  MemberListQuery,
  MemberUpdateInput,
} from "@/lib/member-validation";
import { hashPassword } from "@/lib/password";
import { db } from "@/lib/db";
import type { ApiErrorCode, ApiFieldErrors } from "@/types/api";
import type {
  InvitationSummary,
  WorkspaceInvitation,
  WorkspaceInvitationList,
  WorkspaceMember,
  WorkspaceMemberPage,
} from "@/types/members";

export class WorkspaceMemberServiceError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: ApiFieldErrors,
  ) {
    super(message);
    this.name = "WorkspaceMemberServiceError";
  }
}

const memberSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  lastLoginAt: true,
});

function serializeMember(
  member: Prisma.UserGetPayload<{ select: typeof memberSelect }>,
  currentUserId: string,
): WorkspaceMember {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    isActive: member.isActive,
    createdAt: member.createdAt.toISOString(),
    lastLoginAt: member.lastLoginAt?.toISOString() ?? null,
    isCurrentUser: member.id === currentUserId,
  };
}

function createMemberOrderBy(
  sortBy: MemberListQuery["sortBy"],
  sortOrder: MemberListQuery["sortOrder"],
): Prisma.UserOrderByWithRelationInput[] {
  let primary: Prisma.UserOrderByWithRelationInput;

  switch (sortBy) {
    case "name":
      primary = { name: sortOrder };
      break;
    case "email":
      primary = { email: sortOrder };
      break;
    case "role":
      primary = { role: sortOrder };
      break;
    case "lastLoginAt":
      primary = { lastLoginAt: sortOrder };
      break;
    case "createdAt":
      primary = { createdAt: sortOrder };
      break;
  }

  return [primary, { id: "asc" }];
}

export async function listWorkspaceMembers(
  workspaceId: string,
  currentUserId: string,
  query: MemberListQuery,
): Promise<WorkspaceMemberPage> {
  const where: Prisma.UserWhereInput = {
    workspaceId,
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { isActive: query.status === "ACTIVE" } : {}),
    ...(query.search
      ? {
          OR: [
            {
              name: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const skip = (query.page - 1) * query.pageSize;
  const [totalItems, members] = await db.$transaction([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: memberSelect,
      orderBy: createMemberOrderBy(query.sortBy, query.sortOrder),
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    items: members.map((member) => serializeMember(member, currentUserId)),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize)),
    },
  };
}

export async function updateWorkspaceMember(
  workspaceId: string,
  actorId: string,
  memberId: string,
  input: MemberUpdateInput,
): Promise<WorkspaceMember> {
  return db.$transaction(async (transaction) => {
    const target = await transaction.user.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
      select: memberSelect,
    });

    if (!target) {
      throw new WorkspaceMemberServiceError(
        "MEMBER_NOT_FOUND",
        "The workspace member could not be found.",
        404,
      );
    }

    const roleWillChange = input.role !== undefined && input.role !== target.role;
    const activeStateWillChange =
      input.isActive !== undefined && input.isActive !== target.isActive;

    if (target.id === actorId && (roleWillChange || activeStateWillChange)) {
      throw new WorkspaceMemberServiceError(
        "SELF_MANAGEMENT_FORBIDDEN",
        "You cannot change your own role or active status.",
        409,
      );
    }

    const removesActiveAdmin =
      target.role === "ADMIN" &&
      target.isActive &&
      ((input.role !== undefined && input.role !== "ADMIN") || input.isActive === false);

    if (removesActiveAdmin) {
      const activeAdminCount = await transaction.user.count({
        where: {
          workspaceId,
          role: "ADMIN",
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        throw new WorkspaceMemberServiceError(
          "LAST_ADMIN_REQUIRED",
          "The workspace must retain at least one active administrator.",
          409,
        );
      }
    }

    const updateResult = await transaction.user.updateMany({
      where: {
        id: memberId,
        workspaceId,
      },
      data: {
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    if (updateResult.count !== 1) {
      throw new WorkspaceMemberServiceError(
        "MEMBER_UPDATE_FAILED",
        "The workspace member could not be updated.",
        409,
      );
    }

    const updatedMember = await transaction.user.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
      select: memberSelect,
    });

    if (!updatedMember) {
      throw new WorkspaceMemberServiceError(
        "MEMBER_NOT_FOUND",
        "The workspace member could not be found after the update.",
        404,
      );
    }

    return serializeMember(updatedMember, actorId);
  });
}

export async function listWorkspaceInvitations(
  workspaceId: string,
): Promise<WorkspaceInvitationList> {
  const now = new Date();
  const invitations = await db.workspaceInvitation.findMany({
    where: {
      workspaceId,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 50,
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      expiresAt: true,
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    items: invitations.map(
      (invitation): WorkspaceInvitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        createdAt: invitation.createdAt.toISOString(),
        expiresAt: invitation.expiresAt.toISOString(),
        invitedBy: invitation.invitedBy,
      }),
    ),
  };
}

export async function createWorkspaceInvitation(
  workspaceId: string,
  invitedById: string,
  input: InvitationCreateInput,
): Promise<{
  invitation: WorkspaceInvitation;
  token: string;
}> {
  const token = createInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const now = new Date();
  const expiresAt = createInvitationExpiry(now);

  try {
    return await db.$transaction(async (transaction) => {
      const existingMember = await transaction.user.findFirst({
        where: {
          workspaceId,
          email: input.email,
        },
        select: {
          id: true,
        },
      });

      if (existingMember) {
        throw new WorkspaceMemberServiceError(
          "EMAIL_ALREADY_EXISTS",
          "This email already belongs to a member of the workspace.",
          409,
          {
            email: ["This email already belongs to a member of the workspace."],
          },
        );
      }

      await transaction.workspaceInvitation.updateMany({
        where: {
          workspaceId,
          email: input.email,
          acceptedAt: null,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      const invitation = await transaction.workspaceInvitation.create({
        data: {
          workspaceId,
          invitedById,
          email: input.email,
          role: input.role,
          tokenHash,
          expiresAt,
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          expiresAt: true,
          invitedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        token,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          createdAt: invitation.createdAt.toISOString(),
          expiresAt: invitation.expiresAt.toISOString(),
          invitedBy: invitation.invitedBy,
        },
      };
    });
  } catch (error: unknown) {
    if (error instanceof WorkspaceMemberServiceError) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new WorkspaceMemberServiceError(
        "INVITATION_CREATE_FAILED",
        "An active invitation already exists for this email address.",
        409,
        {
          email: ["An active invitation already exists for this email address."],
        },
      );
    }

    throw error;
  }
}

export async function revokeWorkspaceInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<void> {
  const result = await db.workspaceInvitation.updateMany({
    where: {
      id: invitationId,
      workspaceId,
      acceptedAt: null,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new WorkspaceMemberServiceError(
      "INVITATION_NOT_FOUND",
      "The active workspace invitation could not be found.",
      404,
    );
  }
}

export async function getInvitationSummary(token: string): Promise<InvitationSummary> {
  const tokenHash = hashInvitationToken(token);
  const invitation = await db.workspaceInvitation.findUnique({
    where: {
      tokenHash,
    },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      workspace: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invitation) {
    return {
      state: "NOT_FOUND",
    };
  }

  const common = {
    email: invitation.email,
    role: invitation.role,
    workspaceName: invitation.workspace.name,
    expiresAt: invitation.expiresAt.toISOString(),
  } as const;

  if (invitation.acceptedAt) {
    return {
      state: "ACCEPTED",
      ...common,
    };
  }

  if (invitation.revokedAt) {
    return {
      state: "REVOKED",
      ...common,
    };
  }

  if (invitation.expiresAt.getTime() <= Date.now()) {
    return {
      state: "EXPIRED",
      ...common,
    };
  }

  return {
    state: "ACTIVE",
    ...common,
  };
}

export async function acceptWorkspaceInvitation(
  token: string,
  input: InvitationAcceptInput,
): Promise<{
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
}> {
  const tokenHash = hashInvitationToken(token);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  try {
    return await db.$transaction(
      async (transaction) => {
        const invitation = await transaction.workspaceInvitation.findUnique({
          where: {
            tokenHash,
          },
          select: {
            id: true,
            email: true,
            role: true,
            expiresAt: true,
            acceptedAt: true,
            revokedAt: true,
            workspaceId: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });

        if (!invitation) {
          throw new WorkspaceMemberServiceError(
            "INVITATION_NOT_FOUND",
            "This invitation could not be found.",
            404,
          );
        }

        if (invitation.acceptedAt) {
          throw new WorkspaceMemberServiceError(
            "INVITATION_ALREADY_ACCEPTED",
            "This invitation has already been accepted.",
            409,
          );
        }

        if (invitation.revokedAt) {
          throw new WorkspaceMemberServiceError(
            "INVITATION_REVOKED",
            "This invitation has been revoked by a workspace administrator.",
            410,
          );
        }

        if (invitation.expiresAt.getTime() <= now.getTime()) {
          throw new WorkspaceMemberServiceError(
            "INVITATION_EXPIRED",
            "This invitation has expired. Ask a workspace administrator for a new link.",
            410,
          );
        }

        const claimResult = await transaction.workspaceInvitation.updateMany({
          where: {
            id: invitation.id,
            workspaceId: invitation.workspaceId,
            acceptedAt: null,
            revokedAt: null,
            expiresAt: {
              gt: now,
            },
          },
          data: {
            acceptedAt: now,
          },
        });

        if (claimResult.count !== 1) {
          throw new WorkspaceMemberServiceError(
            "INVITATION_ALREADY_ACCEPTED",
            "This invitation is no longer available.",
            409,
          );
        }

        const user = await transaction.user.create({
          data: {
            workspaceId: invitation.workspaceId,
            name: input.name,
            email: invitation.email,
            passwordHash,
            role: invitation.role,
            isActive: true,
            emailVerifiedAt: now,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        return {
          user,
          workspace: invitation.workspace,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error: unknown) {
    if (error instanceof WorkspaceMemberServiceError) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new WorkspaceMemberServiceError(
        "INVITATION_EMAIL_UNAVAILABLE",
        "An account already exists for this email address.",
        409,
      );
    }

    throw error;
  }
}