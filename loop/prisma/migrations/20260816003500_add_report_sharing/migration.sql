ALTER TABLE "Report"
  ADD COLUMN "shareTokenHash" CHAR(64),
  ADD COLUMN "shareEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "shareCreatedAt" TIMESTAMPTZ(3);

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_share_state_consistency_check"
  CHECK (
    (
      "shareEnabled" = false
      AND "shareTokenHash" IS NULL
      AND "shareCreatedAt" IS NULL
    )
    OR
    (
      "shareEnabled" = true
      AND "shareTokenHash" IS NOT NULL
      AND "shareCreatedAt" IS NOT NULL
    )
  );

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_share_token_hash_format_check"
  CHECK (
    "shareTokenHash" IS NULL
    OR "shareTokenHash" ~ '^[0-9a-f]{64}$'
  );

CREATE UNIQUE INDEX "Report_shareTokenHash_key"
  ON "Report"("shareTokenHash");

CREATE INDEX "Report_workspaceId_shareEnabled_idx"
  ON "Report"("workspaceId", "shareEnabled");