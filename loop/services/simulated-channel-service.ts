import "server-only";

import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import { classifyWorkspaceFeedbackBatch } from "@/services/feedback-classification-service";
import {
  getSimulatedChannelOption,
  type SimulatedChannelKey,
} from "@/lib/simulated-channel-catalog";
import { SIMULATED_CHANNEL_DATA } from "@/services/simulated-channel-data";
import type { SimulatedChannelImportSummary } from "@/types/simulated-channel";

const MILLISECONDS_PER_HOUR = 60 * 60 * 1_000;

export async function importSimulatedChannel(
  workspaceId: string,
  sourceKey: SimulatedChannelKey,
): Promise<SimulatedChannelImportSummary> {
  const source = getSimulatedChannelOption(sourceKey);
  const templates = SIMULATED_CHANNEL_DATA[sourceKey];

  if (templates.length !== source.itemCount) {
    throw new Error(
      `Simulated source ${sourceKey} expected ${source.itemCount} rows but contains ${templates.length}.`,
    );
  }

  const batchId = randomUUID();
  const importedAt = new Date();
  const preparedRows = templates.map((template, index) => {
    const createdAt = new Date(
      importedAt.getTime() - template.ageHours * MILLISECONDS_PER_HOUR,
    );

    return {
      id: randomUUID(),
      workspaceId,
      content: template.content,
      channel: source.channel,
      customerLabel: template.customerLabel,
      sourceRef: `${source.sourceRefPrefix}:${batchId}:${String(index + 1).padStart(3, "0")}`,
      status: "NEW" as const,
      classificationStatus: "PENDING" as const,
      classificationAttempts: 0,
      createdAt,
      updatedAt: importedAt,
    };
  });

  const result = await db.feedback.createMany({
    data: preparedRows,
  });

  if (result.count !== preparedRows.length) {
    throw new Error(
      `Simulated source ${sourceKey} imported ${result.count} of ${preparedRows.length} rows.`,
    );
  }

  const classification = await classifyWorkspaceFeedbackBatch(
    workspaceId,
    preparedRows.map((row) => row.id),
  );
  const timestamps = preparedRows.map((row) => row.createdAt.getTime());

  return {
    batchId,
    source: source.key,
    sourceName: source.name,
    channel: source.channel,
    totalRows: preparedRows.length,
    importedRows: result.count,
    classificationQueuedRows: classification.skippedRows,
    classification,
    importedAt: importedAt.toISOString(),
    oldestFeedbackAt: new Date(Math.min(...timestamps)).toISOString(),
    newestFeedbackAt: new Date(Math.max(...timestamps)).toISOString(),
  };
}