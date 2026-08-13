import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { ClassificationResult } from "@/services/classification-service";

const ALLOWED_THEMES = [
  "Authentication & SSO",
  "Billing & Invoices",
  "Collaboration & Permissions",
  "Customer Support",
  "Integrations & API",
  "Mobile Experience",
  "Onboarding & Setup",
  "Performance & Reliability",
  "Reporting & Export",
  "Search & Navigation",
] as const;

type AllowedTheme = (typeof ALLOWED_THEMES)[number];

function normalizeThemeName(
  theme: string,
): AllowedTheme {
  const cleaned = theme
    .trim()
    .replace(/\s+/g, " ");

  const normalized = cleaned.toLowerCase();

  const themeAliases: Record<
    string,
    AllowedTheme
  > = {
    // Authentication
    "authentication & sso": "Authentication & SSO",
    authentication: "Authentication & SSO",
    login: "Authentication & SSO",
    "login issue": "Authentication & SSO",
    "login problem": "Authentication & SSO",
    sso: "Authentication & SSO",

    // Billing
    "billing & invoices": "Billing & Invoices",
    "billing and invoices": "Billing & Invoices",
    billing: "Billing & Invoices",
    invoice: "Billing & Invoices",
    invoices: "Billing & Invoices",
    payment: "Billing & Invoices",
    payments: "Billing & Invoices",
    "payment issue": "Billing & Invoices",
    "payment problem": "Billing & Invoices",

    // Collaboration
    "collaboration & permissions":
      "Collaboration & Permissions",
    collaboration:
      "Collaboration & Permissions",
    permissions:
      "Collaboration & Permissions",
    roles:
      "Collaboration & Permissions",
    "team collaboration":
      "Collaboration & Permissions",

    // Support
    "customer support": "Customer Support",
    support: "Customer Support",
    "support issue": "Customer Support",
    "customer service": "Customer Support",

    // Integrations
    "integrations & api": "Integrations & API",
    integrations: "Integrations & API",
    integration: "Integrations & API",
    api: "Integrations & API",
    webhooks: "Integrations & API",

    // Mobile
    "mobile experience": "Mobile Experience",
    mobile: "Mobile Experience",
    "mobile app": "Mobile Experience",
    android: "Mobile Experience",
    ios: "Mobile Experience",

    // Onboarding
    "onboarding & setup": "Onboarding & Setup",
    onboarding: "Onboarding & Setup",
    setup: "Onboarding & Setup",
    configuration: "Onboarding & Setup",

    // Performance
    "performance & reliability":
      "Performance & Reliability",
    performance: "Performance & Reliability",
    reliability: "Performance & Reliability",
    "slow performance":
      "Performance & Reliability",
    "performance issue":
      "Performance & Reliability",
    "performance problem":
      "Performance & Reliability",
    speed: "Performance & Reliability",

    // Reporting
    "reporting & export": "Reporting & Export",
    reporting: "Reporting & Export",
    reports: "Reporting & Export",
    export: "Reporting & Export",
    "data export": "Reporting & Export",

    // Search
    "search & navigation":
      "Search & Navigation",
    search: "Search & Navigation",
    navigation: "Search & Navigation",
    filters: "Search & Navigation",
  };

  const result =
    themeAliases[normalized];

  if (result) {
    return result;
  }

  // Safety fallback.
  // Do NOT allow Gemini to create arbitrary themes.
  return "Customer Support";
}

function generateThemeColor(
  name: string,
): string {
  const colors = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F97316",
    "#14B8A6",
    "#06B6D4",
    "#22C55E",
    "#EAB308",
  ];

  let hash = 0;

  for (
    let index = 0;
    index < name.length;
    index += 1
  ) {
    hash =
      name.charCodeAt(index) +
      ((hash << 5) - hash);
  }

  return colors[
    Math.abs(hash) % colors.length
  ];
}

/**
 * Assign classified feedback to a predefined theme.
 */
export async function assignFeedbackTheme(
  feedbackId: string,
  workspaceId: string,
  classification: ClassificationResult,
) {
  const themeName = normalizeThemeName(
    classification.theme,
  );

  console.log(
    "THEME CLASSIFICATION:",
    classification.theme,
  );

  console.log(
    "NORMALIZED THEME:",
    themeName,
  );

  const theme =
    await db.theme.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name: themeName,
        },
      },

      update: {
        description:
          `Customer feedback related to ${themeName}.`,
        updatedAt: new Date(),
      },

      create: {
        workspaceId,
        name: themeName,
        description:
          `Customer feedback related to ${themeName}.`,
        color:
          generateThemeColor(themeName),
      },
    });

  const feedbackTheme =
    await db.feedbackTheme.upsert({
      where: {
        feedbackId_themeId: {
          feedbackId,
          themeId: theme.id,
        },
      },

      update: {
        confidence:
          new Prisma.Decimal(
            classification.themeConfidence.toFixed(
              3,
            ),
          ),
      },

      create: {
        feedbackId,
        themeId: theme.id,
        workspaceId,
        confidence:
          new Prisma.Decimal(
            classification.themeConfidence.toFixed(
              3,
            ),
          ),
      },
    });

  console.log(
    "THEME ASSIGNED:",
    {
      themeId: theme.id,
      themeName: theme.name,
      feedbackId,
      confidence:
        feedbackTheme.confidence.toString(),
    },
  );

  return theme;
}

/**
 * Get theme counts for a workspace.
 */
export async function getThemeCounts(
  workspaceId: string,
) {
  const themes =
    await db.theme.findMany({
      where: {
        workspaceId,
      },

      orderBy: {
        name: "asc",
      },

      include: {
        _count: {
          select: {
            feedback: true,
          },
        },
      },
    });

  return themes.map((theme) => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
    color: theme.color,
    count: theme._count.feedback,
  }));
}

/**
 * Get details for one theme.
 */
export async function getThemeDetails(
  workspaceId: string,
  themeId: string,
) {
  return db.theme.findFirst({
    where: {
      id: themeId,
      workspaceId,
    },

    include: {
      _count: {
        select: {
          feedback: true,
        },
      },

      feedback: {
        orderBy: {
          createdAt: "desc",
        },

        include: {
          feedback: {
            select: {
              id: true,
              content: true,
              sentiment: true,
              sentimentScore: true,
              featureArea: true,
              classificationRationale: true,
              createdAt: true,
              channel: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Drill down into feedback belonging to a theme.
 */
export async function getThemeFeedback(
  workspaceId: string,
  themeId: string,
) {
  const theme =
    await db.theme.findFirst({
      where: {
        id: themeId,
        workspaceId,
      },

      select: {
        id: true,
        name: true,
        description: true,
        color: true,
      },
    });

  if (!theme) {
    return null;
  }

  const feedback =
    await db.feedbackTheme.findMany({
      where: {
        workspaceId,
        themeId,
      },

      orderBy: {
        feedback: {
          createdAt: "desc",
        },
      },

      include: {
        feedback: {
          select: {
            id: true,
            content: true,
            sentiment: true,
            sentimentScore: true,
            featureArea: true,
            classificationRationale: true,
            classificationStatus: true,
            channel: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

  return {
    theme,

    feedback: feedback.map(
      (item) => ({
        ...item.feedback,
        confidence:
          item.confidence,
      }),
    ),
  };
}