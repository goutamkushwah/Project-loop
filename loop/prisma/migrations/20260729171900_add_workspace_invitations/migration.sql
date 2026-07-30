-- CreateTable
CREATE TABLE "WorkspaceInvitation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" VARCHAR(254) NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
  "tokenHash" CHAR(64) NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "acceptedAt" TIMESTAMPTZ(3),
  "revokedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "workspaceId" UUID NOT NULL,
  "invitedById" UUID,

  CONSTRAINT "WorkspaceInvitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkspaceInvitation_email_lowercase" CHECK ("email" = lower("email")),
  CONSTRAINT "WorkspaceInvitation_email_not_blank" CHECK (length(btrim("email")) > 3),
  CONSTRAINT "WorkspaceInvitation_token_hash_format" CHECK ("tokenHash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "WorkspaceInvitation_expiry_valid" CHECK ("expiresAt" > "createdAt"),
  CONSTRAINT "WorkspaceInvitation_terminal_state_valid" CHECK (
    NOT ("acceptedAt" IS NOT NULL AND "revokedAt" IS NOT NULL)
  )
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceInvitation_tokenHash_key"
  ON "WorkspaceInvitation"("tokenHash");

CREATE INDEX "WorkspaceInvitation_workspaceId_email_idx"
  ON "WorkspaceInvitation"("workspaceId", "email");

CREATE INDEX "WorkspaceInvitation_workspaceId_createdAt_idx"
  ON "WorkspaceInvitation"("workspaceId", "createdAt" DESC);

CREATE INDEX "WorkspaceInvitation_workspaceId_expiresAt_idx"
  ON "WorkspaceInvitation"("workspaceId", "expiresAt");

CREATE INDEX "WorkspaceInvitation_invitedById_idx"
  ON "WorkspaceInvitation"("invitedById");

CREATE UNIQUE INDEX "WorkspaceInvitation_active_workspace_email_key"
  ON "WorkspaceInvitation"("workspaceId", "email")
  WHERE "acceptedAt" IS NULL AND "revokedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "WorkspaceInvitation"
  ADD CONSTRAINT "WorkspaceInvitation_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceInvitation"
  ADD CONSTRAINT "WorkspaceInvitation_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- The inviter must belong to the same workspace as the invitation.
CREATE OR REPLACE FUNCTION enforce_invitation_creator_workspace()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  inviter_workspace UUID;
BEGIN
  IF NEW."invitedById" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT "workspaceId"
  INTO inviter_workspace
  FROM "User"
  WHERE "id" = NEW."invitedById";

  IF inviter_workspace IS NULL THEN
    RAISE EXCEPTION 'Invitation creator does not exist';
  END IF;

  IF NEW."workspaceId" <> inviter_workspace THEN
    RAISE EXCEPTION 'Cross-workspace invitation creator relation is forbidden';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "WorkspaceInvitation_creator_workspace_guard"
BEFORE INSERT OR UPDATE ON "WorkspaceInvitation"
FOR EACH ROW EXECUTE FUNCTION enforce_invitation_creator_workspace();

-- Tenant ownership cannot be reassigned after creation.
CREATE TRIGGER "WorkspaceInvitation_workspace_immutable"
BEFORE UPDATE OF "workspaceId" ON "WorkspaceInvitation"
FOR EACH ROW EXECUTE FUNCTION prevent_workspace_reassignment();