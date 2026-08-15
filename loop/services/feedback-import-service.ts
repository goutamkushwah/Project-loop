//import "server-only";

import { randomUUID } from "node:crypto";

import type { FeedbackChannel, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { classifyWorkspaceFeedbackBatch } from "@/services/feedback-classification-service";
import { MAX_RETURNED_IMPORT_ERRORS } from "@/lib/feedback-import-constants";
import type {
  FeedbackCsvImportError,
  FeedbackCsvImportSummary,
  ParsedFeedbackCsv,
  ParsedFeedbackCsvRow,
} from "@/types/feedback-import";

function sourceKey(row: Pick<ParsedFeedbackCsvRow, "channel" | "sourceRef">): string | null {
  return row.sourceRef ? `${row.channel}\u0000${row.sourceRef}` : null;
}

function duplicateError(
  row: ParsedFeedbackCsvRow,
  code: "DUPLICATE_SOURCE_REFERENCE" | "EXISTING_SOURCE_REFERENCE" | "IMPORT_CONFLICT",
  message: string,
): FeedbackCsvImportError {
  return {
    row: row.rowNumber,
    field: "source_ref",
    code,
    message,
  };
}

function buildExistingSourceReferenceWhere(
  workspaceId: string,
  rows: ParsedFeedbackCsvRow[],
): Prisma.FeedbackWhereInput | null {
  const referencesByChannel = new Map<FeedbackChannel, Set<string>>();

  rows.forEach((row) => {
    if (!row.sourceRef) {
      return;
    }

    const channel = row.channel as FeedbackChannel;
    const references = referencesByChannel.get(channel) ?? new Set<string>();
    references.add(row.sourceRef);
    referencesByChannel.set(channel, references);
  });

  const channelFilters: Prisma.FeedbackWhereInput[] = Array.from(
    referencesByChannel.entries(),
  ).map(([channel, references]) => ({
    channel,
    sourceRef: {
      in: Array.from(references),
    },
  }));

  if (channelFilters.length === 0) {
    return null;
  }

  return {
    workspaceId,
    OR: channelFilters,
  };
}

export async function importWorkspaceFeedbackCsv(
  workspaceId: string,
  fileName: string,
  parsedCsv: ParsedFeedbackCsv,
): Promise<FeedbackCsvImportSummary> {
  const errors = [...parsedCsv.errors];
  const failedRows = new Set(parsedCsv.errors.map((error) => error.row));
  const seenSourceReferences = new Map<string, number>();

  parsedCsv.validRows.forEach((row) => {
    const key = sourceKey(row);

    if (!key) {
      return;
    }

    const firstRow = seenSourceReferences.get(key);

    if (firstRow) {
      failedRows.add(row.rowNumber);
      errors.push(
        duplicateError(
          row,
          "DUPLICATE_SOURCE_REFERENCE",
          `This channel and source reference already appear on row ${firstRow}.`,
        ),
      );
      return;
    }

    seenSourceReferences.set(key, row.rowNumber);
  });

  const rowsWithoutFileDuplicates = parsedCsv.validRows.filter(
    (row) => !failedRows.has(row.rowNumber),
  );
  const existingWhere = buildExistingSourceReferenceWhere(
    workspaceId,
    rowsWithoutFileDuplicates,
  );

  if (existingWhere) {
    const existingFeedback = await db.feedback.findMany({
      where: existingWhere,
      select: {
        channel: true,
        sourceRef: true,
      },
    });
    const existingKeys = new Set(
      existingFeedback
        .filter(
          (feedback): feedback is typeof feedback & { sourceRef: string } =>
            feedback.sourceRef !== null,
        )
        .map((feedback) => `${feedback.channel}\u0000${feedback.sourceRef}`),
    );

    rowsWithoutFileDuplicates.forEach((row) => {
      const key = sourceKey(row);

      if (key && existingKeys.has(key)) {
        failedRows.add(row.rowNumber);
        errors.push(
          duplicateError(
            row,
            "EXISTING_SOURCE_REFERENCE",
            "A feedback item with this channel and source reference already exists in the workspace.",
          ),
        );
      }
    });
  }

  const importableRows = parsedCsv.validRows.filter(
    (row) => !failedRows.has(row.rowNumber),
  );
  const importedAt = new Date();
  const preparedRows = importableRows.map((row) => ({
    row,
    data: {
      id: randomUUID(),
      workspaceId,
      content: row.content,
      channel: row.channel,
      customerLabel: row.customerLabel,
      sourceRef: row.sourceRef,
      status: "NEW" as const,
      classificationStatus: "PENDING" as const,
      classificationAttempts: 0,
      createdAt: row.createdAt ?? importedAt,
      updatedAt: importedAt,
    },
  }));

  if (preparedRows.length > 0) {
    await db.feedback.createMany({
      data: preparedRows.map((prepared) => prepared.data),
      skipDuplicates: true,
    });

    const insertedRecords = await db.feedback.findMany({
      where: {
        workspaceId,
        id: {
          in: preparedRows.map((prepared) => prepared.data.id),
        },
      },
      select: {
        id: true,
      },
    });
    const insertedIds = new Set(insertedRecords.map((record) => record.id));

    preparedRows.forEach((prepared) => {
      if (!insertedIds.has(prepared.data.id)) {
        failedRows.add(prepared.row.rowNumber);
        errors.push(
          duplicateError(
            prepared.row,
            "IMPORT_CONFLICT",
            "The row conflicted with a feedback item created during this import. Upload it again with a different source reference.",
          ),
        );
      }
    });
  }

  const importedRows = parsedCsv.totalRows - failedRows.size;
  const insertedFeedbackIds = preparedRows
    .filter((prepared) => !failedRows.has(prepared.row.rowNumber))
    .map((prepared) => prepared.data.id);
  const classification = await classifyWorkspaceFeedbackBatch(
    workspaceId,
    insertedFeedbackIds,
  );
  const returnedErrors = errors.slice(0, MAX_RETURNED_IMPORT_ERRORS);

  return {
    fileName,
    totalRows: parsedCsv.totalRows,
    importedRows,
    failedRows: failedRows.size,
    classificationQueuedRows: classification.skippedRows,
    classification,
    errors: returnedErrors,
    truncatedErrorCount: Math.max(0, errors.length - returnedErrors.length),
  };
}