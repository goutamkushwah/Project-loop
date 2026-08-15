import { FeedbackChannel, UserRole } from "@prisma/client";

export const DEMO_WORKSPACE = {
  name: "Acme-Cloud",
  slug: "acme-cloud",
} as const;

export const DEMO_USERS = [
  {
    name: "Goutam",
    email: "admin@loop.demo",
    role: UserRole.ADMIN,
    passwordEnvironmentKey: "SEED_ADMIN_PASSWORD",
    defaultPassword: "LoopAdmin!2026",
  },
  {
    name: "Gaurav",
    email: "analyst@loop.demo",
    role: UserRole.ANALYST,
    passwordEnvironmentKey: "SEED_ANALYST_PASSWORD",
    defaultPassword: "LoopAnalyst!2026",
  },
  {
    name: "mohan",
    email: "viewer@loop.demo",
    role: UserRole.VIEWER,
    passwordEnvironmentKey: "SEED_VIEWER_PASSWORD",
    defaultPassword: "LoopViewer!2026",
  },
] as const;

export const THEME_SEEDS = [
  {
    name: "Onboarding & Setup",
    description: "Account setup, workspace configuration, invitations, and first-use guidance.",
    color: "#7C6CE7",
  },
  {
    name: "Performance & Reliability",
    description: "Speed, timeouts, availability, errors, and product stability.",
    color: "#DC2626",
  },
  {
    name: "Mobile Experience",
    description: "Usability and responsiveness on mobile browsers and smaller screens.",
    color: "#2563EB",
  },
  {
    name: "Billing & Invoices",
    description: "Plans, invoices, taxes, billing workflows, and payment-related product screens.",
    color: "#D97706",
  },
  {
    name: "Integrations & API",
    description: "External integrations, webhooks, developer APIs, and connection reliability.",
    color: "#0891B2",
  },
  {
    name: "Authentication & SSO",
    description: "Login, password recovery, session handling, SSO, and identity management.",
    color: "#9333EA",
  },
  {
    name: "Reporting & Export",
    description: "Dashboards, reports, CSV/PDF exports, and data portability.",
    color: "#059669",
  },
  {
    name: "Collaboration & Permissions",
    description: "Roles, member access, sharing, ownership, and team workflows.",
    color: "#4F46E5",
  },
  {
    name: "Search & Navigation",
    description: "Finding information, filters, page navigation, and information architecture.",
    color: "#DB2777",
  },
  {
    name: "Customer Support",
    description: "Help content, response quality, support interactions, and issue resolution.",
    color: "#65A30D",
  },
] as const;

export const CUSTOMER_CONTEXTS = [
  {
    customerLabel: "Northstar Health",
    suffix: "We are using the product across a 42-seat workspace.",
  },
  {
    customerLabel: "Atlas Commerce",
    suffix: "This came up during our latest account review.",
  },
  {
    customerLabel: "Brightline Labs",
    suffix: "Several teammates mentioned the same thing this week.",
  },
  {
    customerLabel: "Cedar Finance",
    suffix: "It has been noticeable since our recent rollout.",
  },
  {
    customerLabel: "Orbit Logistics",
    suffix: "This matters to our team’s day-to-day workflow.",
  },
] as const;

export const FEEDBACK_BLUEPRINTS = [
  {
    channel: FeedbackChannel.SUPPORT_TICKET,
    content:
      "Onboarding took much longer than expected because the invitation flow did not explain why two teammates could not join the workspace.",
  },
  {
    channel: FeedbackChannel.SUPPORT_TICKET,
    content:
      "The billing page repeatedly timed out while I was downloading last month’s invoice, and the retry button did not recover the request.",
  },
  {
    channel: FeedbackChannel.SUPPORT_TICKET,
    content:
      "A saved dashboard sometimes opens with an empty chart until the browser is refreshed, even though the underlying feedback is present.",
  },
  {
    channel: FeedbackChannel.SUPPORT_TICKET,
    content:
      "The support specialist identified our CSV formatting issue quickly and gave us a clear explanation that prevented the same mistake on the next import.",
  },
  {
    channel: FeedbackChannel.LIVE_CHAT,
    content:
      "The password-reset link expired before I could use it, but the login screen did not provide a direct way to request another link.",
  },
  {
    channel: FeedbackChannel.LIVE_CHAT,
    content:
      "Search returned no results for an exact customer phrase that is visible inside several feedback records.",
  },
  {
    channel: FeedbackChannel.LIVE_CHAT,
    content:
      "The agent was helpful, but the chat disconnected when I moved from the dashboard to the inbox and I had to explain the issue again.",
  },
  {
    channel: FeedbackChannel.APP_STORE_REVIEW,
    content:
      "The redesigned dashboard is noticeably faster and the top-theme cards make it much easier to understand what changed this week.",
  },
  {
    channel: FeedbackChannel.APP_STORE_REVIEW,
    content:
      "The mobile layout is cramped on a small screen, especially when the filter panel and feedback table are open at the same time.",
  },
  {
    channel: FeedbackChannel.APP_STORE_REVIEW,
    content:
      "Exporting a report is simple and the generated document is polished enough to share directly with leadership.",
  },
  {
    channel: FeedbackChannel.NPS_SURVEY,
    content:
      "The product covers our core workflow, but the API documentation needs clearer pagination and rate-limit examples before we can expand the integration.",
  },
  {
    channel: FeedbackChannel.NPS_SURVEY,
    content:
      "The setup checklist gave our team confidence because each step had a clear owner and completion state.",
  },
  {
    channel: FeedbackChannel.NPS_SURVEY,
    content:
      "Filtering is useful, but the selected filters reset whenever I open a feedback item and return to the inbox.",
  },
  {
    channel: FeedbackChannel.CSAT_SURVEY,
    content:
      "The latest incident was resolved, although the error message shown to users was too generic to help us understand what had failed.",
  },
  {
    channel: FeedbackChannel.CSAT_SURVEY,
    content:
      "The customer-success team was responsive and followed up with a concise summary of the issue, the fix, and the expected prevention steps.",
  },
  {
    channel: FeedbackChannel.SALES_CALL_NOTE,
    content:
      "The prospect requires SAML SSO and automated user provisioning before they can approve a company-wide rollout.",
  },
  {
    channel: FeedbackChannel.SALES_CALL_NOTE,
    content:
      "The buyer liked the analytics story but asked for more granular viewer permissions so regional teams cannot see each other’s customer feedback.",
  },
  {
    channel: FeedbackChannel.SALES_CALL_NOTE,
    content:
      "The operations lead wants scheduled exports because manually downloading the same weekly report is slowing down their leadership preparation.",
  },
  {
    channel: FeedbackChannel.COMMUNITY_POST,
    content:
      "The new global search is a major improvement because it finds feedback by customer name, theme, and exact wording from one place.",
  },
  {
    channel: FeedbackChannel.COMMUNITY_POST,
    content:
      "CSV export drops accented characters from a few customer names, which makes the file unreliable for our international account review.",
  },
  {
    channel: FeedbackChannel.COMMUNITY_POST,
    content:
      "The permission labels are easy to understand and the read-only viewer role finally lets us share insights without risking accidental edits.",
  },
  {
    channel: FeedbackChannel.SOCIAL_MENTION,
    content:
      "The product is genuinely useful for spotting repeated onboarding complaints that were previously scattered across support and survey tools.",
  },
  {
    channel: FeedbackChannel.SOCIAL_MENTION,
    content:
      "The Slack connection has disconnected twice this month without notifying an administrator, so several days of feedback were missed.",
  },
  {
    channel: FeedbackChannel.SOCIAL_MENTION,
    content:
      "Dark mode looks polished, but a few chart labels do not have enough contrast when viewed on a laptop with reduced brightness.",
  },
] as const;