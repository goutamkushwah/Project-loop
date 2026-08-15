import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

console.log("PDFKIT RESOLVED FROM:", require.resolve("pdfkit"));
import { authorizeApi } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { reportIdSchema } from "@/lib/report-validation";
import {
  getWorkspaceReport,
  ReportServiceError,
} from "@/services/report-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  const authorization = await authorizeApi(PERMISSIONS.REPORTS_READ);

  if (!authorization.ok) {
    return authorization.response;
  }

  const { reportId } = await context.params;

  const parsedId = reportIdSchema.safeParse(reportId);

  if (!parsedId.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Report ID must be a valid UUID.",
        },
      },
      { status: 422 },
    );
  }

  try {
    const report = await getWorkspaceReport(
      authorization.user.workspaceId,
      parsedId.data,
    );

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "REPORT_NOT_FOUND",
            message: "The requested report was not found in this workspace.",
          },
        },
        { status: 404 },
      );
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    // Explicitly use the PDFKit instance created from the current project.
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", reject);

      const content = report.content;

      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(report.title);

      doc.moveDown();

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Report Period: ${content.period.dateFrom} to ${content.period.dateTo}`,
        );

      doc.text(`Generated: ${content.generatedAt}`);

      doc.moveDown();

      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text("Overview");

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .font("Helvetica")
        .text(`Total Feedback: ${content.stats.totalFeedback}`);

      doc.text(`Classified Feedback: ${content.stats.classifiedFeedback}`);

      doc.text(
        `Classification Coverage: ${content.stats.classificationCoverage}%`,
      );

      doc.moveDown();

      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text("Sentiment");

      doc.moveDown(0.5);

      for (const item of content.sentiment) {
        doc
          .fontSize(11)
          .font("Helvetica")
          .text(
            `${item.label}: ${item.count} (${item.percentage}%)`,
          );
      }

      doc.moveDown();

      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text("Top Themes");

      doc.moveDown(0.5);

      for (const theme of content.topThemes) {
        doc
          .fontSize(11)
          .font("Helvetica")
          .text(
            `${theme.name}: ${theme.count} (${theme.percentage}%)`,
          );
      }

      doc.moveDown();

      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text("AI Summary");

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .font("Helvetica")
        .text(content.narrative.summary);

      doc.moveDown();

      if (content.narrative.recommendedActions.length > 0) {
        doc
          .fontSize(15)
          .font("Helvetica-Bold")
          .text("Recommended Actions");

        doc.moveDown(0.5);

        for (const action of content.narrative.recommendedActions) {
          doc
            .fontSize(11)
            .font("Helvetica")
            .text(`• ${action.action}`);

          doc.moveDown(0.3);
        }
      }

      doc.moveDown();

      if (content.evidence.length > 0) {
        doc
          .fontSize(15)
          .font("Helvetica-Bold")
          .text("Evidence");

        doc.moveDown(0.5);

        for (const evidence of content.evidence) {
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(
              `${evidence.channel} - ${evidence.sentiment ?? "Unknown"}`,
            );

          doc
            .fontSize(10)
            .font("Helvetica")
            .text(evidence.content);

          doc.moveDown(0.5);
        }
      }

      doc.end();
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="loop-report-${report.id}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: unknown) {
    if (error instanceof ReportServiceError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status },
      );
    }

    console.error("Report PDF generation failed.", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "REPORT_PDF_FAILED",
          message: "The report PDF could not be generated.",
        },
      },
      { status: 500 },
    );
  }
}