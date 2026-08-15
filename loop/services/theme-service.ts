//import "server-only";

import { ClassificationStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { classifyWorkspaceFeedbackBatch } from "@/services/feedback-classification-service";
import { listWorkspaceFeedback } from "@/services/feedback-service";
import type { ApiErrorCode } from "@/types/api";
import type { FeedbackListQuery } from "@/lib/feedback-validation";
import type {
  ThemeClusterSummary,
  ThemeDetail,
  ThemeFeedbackPage,
  ThemeListItem,
  ThemePage,
} from "@/types/theme";
import type { ThemeListQuery } from "@/lib/theme-validation";

export class ThemeServiceError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ThemeServiceError";
  }
}

type ThemeRow = {
  id: string;
  name: string;
  description: string;
  color: string;
  feedbackCount: bigint;
  createdAt: Date;
  updatedAt: Date;
};

type CountRow = {
  count: bigint;
};

function serializeTheme(row: ThemeRow): ThemeListItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    feedbackCount: Number(row.feedbackCount),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildThemeSearchSql(workspaceId: string, search: string): Prisma.Sql {
  let whereSql = Prisma.sql`t."workspaceId" = CAST(${workspaceId} AS uuid)`;

  if (search) {
    const searchPattern = `%${search}%`;
    whereSql = Prisma.sql`${whereSql}
      AND (
        t."name" ILIKE ${searchPattern}
        OR t."description" ILIKE ${searchPattern}
      )`;
  }

  return whereSql;
}

function buildThemeOrderSql(query: ThemeListQuery): Prisma.Sql {
  const direction = query.sortOrder === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  switch (query.sortBy) {
    case "name":
      return Prisma.sql`t."name" ${direction}, t."id" ASC`;
    case "createdAt":
      return Prisma.sql`t."createdAt" ${direction}, t."name" ASC, t."id" ASC`;
    case "count":
      return Prisma.sql`COUNT(ft."feedbackId") ${direction}, t."name" ASC, t."id" ASC`;
  }
}

export async function listWorkspaceThemes(
  workspaceId: string,
  query: ThemeListQuery,
): Promise<ThemePage> {
  const whereSql = buildThemeSearchSql(workspaceId, query.search);
  const orderSql = buildThemeOrderSql(query);

  return db.$transaction(
    async (transaction) => {
      const countRows = await transaction.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "count"
        FROM "Theme" AS t
        WHERE ${whereSql}
      `);
      const totalItems = countRows[0] ? Number(countRows[0].count) : 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
      const effectivePage = Math.min(query.page, totalPages);
      const offset = (effectivePage - 1) * query.pageSize;

      const rows =
        totalItems === 0
          ? []
          : await transaction.$queryRaw<ThemeRow[]>(Prisma.sql`
              SELECT
                t."id",
                t."name",
                t."description",
                t."color",
                t."createdAt",
                t."updatedAt",
                COUNT(ft."feedbackId")::bigint AS "feedbackCount"
              FROM "Theme" AS t
              LEFT JOIN "FeedbackTheme" AS ft
                ON ft."themeId" = t."id"
                AND ft."workspaceId" = CAST(${workspaceId} AS uuid)
              WHERE ${whereSql}
              GROUP BY
                t."id",
                t."name",
                t."description",
                t."color",
                t."createdAt",
                t."updatedAt"
              ORDER BY ${orderSql}
              LIMIT ${query.pageSize}
              OFFSET ${offset}
            `);

      return {
        items: rows.map(serializeTheme),
        pagination: {
          page: effectivePage,
          pageSize: query.pageSize,
          totalItems,
          totalPages,
        },
        query: {
          search: query.search,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        },
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    },
  );
}

export async function getWorkspaceTheme(
  workspaceId: string,
  themeId: string,
): Promise<ThemeDetail | null> {
  const rows = await db.$queryRaw<ThemeRow[]>(Prisma.sql`
    SELECT
      t."id",
      t."name",
      t."description",
      t."color",
      t."createdAt",
      t."updatedAt",
      COUNT(ft."feedbackId")::bigint AS "feedbackCount"
    FROM "Theme" AS t
    LEFT JOIN "FeedbackTheme" AS ft
      ON ft."themeId" = t."id"
      AND ft."workspaceId" = CAST(${workspaceId} AS uuid)
    WHERE t."id" = CAST(${themeId} AS uuid)
      AND t."workspaceId" = CAST(${workspaceId} AS uuid)
    GROUP BY
      t."id",
      t."name",
      t."description",
      t."color",
      t."createdAt",
      t."updatedAt"
    LIMIT 1
  `);

  return rows[0] ? serializeTheme(rows[0]) : null;
}

export async function listWorkspaceThemeFeedback(
  workspaceId: string,
  themeId: string,
  query: Omit<FeedbackListQuery, "themeId">,
): Promise<ThemeFeedbackPage> {
  const theme = await getWorkspaceTheme(workspaceId, themeId);

  if (!theme) {
    throw new ThemeServiceError(
      "THEME_NOT_FOUND",
      "The requested theme was not found in this workspace.",
      404,
    );
  }

  const feedback = await listWorkspaceFeedback(workspaceId, {
    ...query,
    themeId,
  });

  return {
    theme,
    feedback,
  };
}

export async function clusterWorkspaceFeedbackThemes(
  workspaceId: string,
  limit: number,
): Promise<ThemeClusterSummary> {
  const staleBefore = new Date(Date.now() - 15 * 60 * 1_000);
  const candidateWhere: Prisma.FeedbackWhereInput = {
    workspaceId,
    OR: [
      {
        classificationStatus: {
          not: ClassificationStatus.PROCESSING,
        },
      },
      {
        classificationStatus: ClassificationStatus.PROCESSING,
        updatedAt: {
          lt: staleBefore,
        },
      },
    ],
    themes: {
      none: {
        workspaceId,
      },
    },
  };

  const [candidateRows, candidates] = await db.$transaction([
    db.feedback.count({
      where: candidateWhere,
    }),
    db.feedback.findMany({
      where: candidateWhere,
      select: {
        id: true,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit,
    }),
  ]);

  const classification = await classifyWorkspaceFeedbackBatch(
    workspaceId,
    candidates.map((candidate) => candidate.id),
  );

  const [remainingUnassignedRows, themeCount] = await Promise.all([
    db.feedback.count({
      where: {
        workspaceId,
        themes: {
          none: {
            workspaceId,
          },
        },
      },
    }),
    db.theme.count({
      where: {
        workspaceId,
      },
    }),
  ]);

  return {
    ...classification,
    candidateRows,
    remainingUnassignedRows,
    themeCount,
  };
}