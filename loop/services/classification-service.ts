import { z } from "zod";

import {
  gemini,
  GEMINI_CLASSIFICATION_MODEL,
} from "@/lib/gemini";

const classificationSchema = z.object({
  sentiment: z.enum(["POS", "NEU", "NEG"]),

  sentimentScore: z
    .number()
    .min(0)
    .max(1),

  theme: z.enum([
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
  ]),

  themeConfidence: z
    .number()
    .min(0)
    .max(1),

  featureArea: z
    .string()
    .min(1)
    .max(120),

  rationale: z
    .string()
    .min(1)
    .max(500),
});

export type ClassificationResult = z.infer<
  typeof classificationSchema
>;

export async function classifyFeedback(
  feedbackText: string,
): Promise<ClassificationResult> {
  if (!feedbackText.trim()) {
    throw new Error("Feedback content is empty");
  }

  const prompt = `
You are an AI customer feedback classifier.

Analyze the following customer feedback:

"""
${feedbackText}
"""

Return ONLY valid JSON.

Use exactly this structure:

{
  "sentiment": "NEG",
  "sentimentScore": 0.97,
  "theme": "Performance & Reliability",
  "themeConfidence": 0.96,
  "featureArea": "Dashboard",
  "rationale": "The customer reports very slow dashboard loading."
}

Rules:

sentiment:
- POS = positive
- NEU = neutral
- NEG = negative

sentimentScore:
- number between 0 and 1
- represents confidence in the sentiment

theme:
- You MUST select EXACTLY ONE theme from the allowed list below.
- NEVER create a new theme.
- NEVER rename a theme.
- NEVER use synonyms.
- NEVER use shortened versions.
- NEVER use variations such as "Performance", "Payment", or "Support".

Allowed themes:

1. Authentication & SSO
2. Billing & Invoices
3. Collaboration & Permissions
4. Customer Support
5. Integrations & API
6. Mobile Experience
7. Onboarding & Setup
8. Performance & Reliability
9. Reporting & Export
10. Search & Navigation

Theme selection rules:

Authentication & SSO:
- Login
- Signup
- Password
- Authentication
- SSO
- Account access

Billing & Invoices:
- Payments
- Billing
- Invoices
- Subscription charges
- Billing problems

Collaboration & Permissions:
- Team collaboration
- Workspace collaboration
- User roles
- Permissions
- Sharing
- Team access

Customer Support:
- Customer service
- Support requests
- Help requests
- Support response
- Contacting support

Integrations & API:
- API
- Webhooks
- Third-party integrations
- External services
- Integration problems

Mobile Experience:
- Mobile app
- Android
- iOS
- Mobile UI
- Mobile experience

Onboarding & Setup:
- Getting started
- Initial setup
- Configuration
- Account setup
- Onboarding

Performance & Reliability:
- Slow loading
- Slow dashboard
- Performance
- Freezing
- Crashes
- Downtime
- Reliability
- System stability

Reporting & Export:
- Reports
- Reporting
- Analytics reports
- CSV export
- PDF export
- Data export

Search & Navigation:
- Search
- Search results
- Navigation
- Menus
- Finding content
- Filters

themeConfidence:
- number between 0 and 1
- represents confidence in the selected theme

featureArea:
- identify the product feature involved
- examples:
  Dashboard
  Login
  Reports
  Settings
  Notifications
  Payments
  Profile
  Search
  Mobile App
  API

rationale:
- briefly explain why this classification was selected
- maximum 500 characters

Important:
- Return the EXACT theme name from the allowed list.
- Do not return "Performance".
- Return "Performance & Reliability".
- Do not return "Payment".
- Return "Billing & Invoices".
- Do not return "Support".
- Return "Customer Support".
- Do not return "Reporting".
- Return "Reporting & Export".
- Do not return "Authentication".
- Return "Authentication & SSO".

Do not return markdown.
Do not return additional fields.
`;

  const response =
    await gemini.models.generateContent({
      model: GEMINI_CLASSIFICATION_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

  const text = response.text?.trim();

  if (!text) {
    throw new Error(
      "Gemini returned an empty response",
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `Gemini returned invalid JSON: ${text}`,
    );
  }

  return classificationSchema.parse(parsed);
}