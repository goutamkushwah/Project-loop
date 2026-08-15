//import "server-only";

import type { SimulatedChannelKey } from "@/lib/simulated-channel-catalog";

type SimulatedFeedbackTemplate = {
  content: string;
  customerLabel: string;
  ageHours: number;
};

export const SIMULATED_CHANNEL_DATA: Record<
  SimulatedChannelKey,
  readonly SimulatedFeedbackTemplate[]
> = {
  "support-desk": [
    {
      customerLabel: "Northstar Health",
      ageHours: 4,
      content:
        "Two invited teammates are stuck on the workspace setup screen because the invitation link opens without explaining which company account they should use.",
    },
    {
      customerLabel: "Atlas Commerce",
      ageHours: 15,
      content:
        "The feedback inbox took almost twenty seconds to load after we imported a large file, and the page showed no progress indicator while it was waiting.",
    },
    {
      customerLabel: "Brightline Labs",
      ageHours: 28,
      content:
        "Our viewer can open the dashboard but receives a generic error when following a direct link to a report that was shared by an administrator.",
    },
    {
      customerLabel: "Cedar Finance",
      ageHours: 43,
      content:
        "The CSV importer correctly rejected invalid rows, but the error summary should include the original customer label so our operations team can fix the source file faster.",
    },
    {
      customerLabel: "Orbit Logistics",
      ageHours: 61,
      content:
        "Search finds the customer name but does not highlight the matching phrase inside a long support transcript, which makes triage slower than expected.",
    },
    {
      customerLabel: "Juniper Works",
      ageHours: 79,
      content:
        "The password reset flow worked, although the confirmation page disappeared so quickly that the user was unsure whether the new password had been saved.",
    },
    {
      customerLabel: "Harbor Analytics",
      ageHours: 102,
      content:
        "A status change from REVIEWED to ACTIONED appeared successful, but the item returned to REVIEWED after the browser was refreshed.",
    },
    {
      customerLabel: "Pinecone Systems",
      ageHours: 128,
      content:
        "The report export is useful, but a long verbatim quote is clipped at the page boundary in the generated PDF.",
    },
    {
      customerLabel: "Vertex Mobility",
      ageHours: 166,
      content:
        "We need a clearer warning before an administrator deactivates a teammate who owns several saved reports and shared views.",
    },
    {
      customerLabel: "Lumen Retail",
      ageHours: 205,
      content:
        "The dashboard is much faster this week and the sentiment cards now match the counts shown in the filtered feedback list.",
    },
    {
      customerLabel: "Nimbus Security",
      ageHours: 247,
      content:
        "Our security review needs documentation confirming that one workspace cannot retrieve another workspace's feedback by changing an ID in the URL.",
    },
    {
      customerLabel: "Summit Education",
      ageHours: 311,
      content:
        "The onboarding checklist was straightforward, and our three-person product team completed setup without contacting support.",
    },
  ],
  "app-store": [
    {
      customerLabel: "Verified reviewer 1042",
      ageHours: 9,
      content:
        "The new dashboard is clean and fast, and the top-theme section gives me a useful summary before our weekly product meeting.",
    },
    {
      customerLabel: "Verified reviewer 2218",
      ageHours: 32,
      content:
        "The mobile layout still feels crowded because the filter controls take most of the screen before any feedback is visible.",
    },
    {
      customerLabel: "Verified reviewer 3901",
      ageHours: 57,
      content:
        "Uploading feedback is simple, but I would like the app to remember the last channel I selected when entering several items in a row.",
    },
    {
      customerLabel: "Verified reviewer 4470",
      ageHours: 84,
      content:
        "Search is noticeably better after the latest update and now returns exact phrases from older customer comments.",
    },
    {
      customerLabel: "Verified reviewer 5126",
      ageHours: 113,
      content:
        "The app signed me out while I was reviewing a long report and did not return me to the same section after I logged in again.",
    },
    {
      customerLabel: "Verified reviewer 6084",
      ageHours: 147,
      content:
        "Theme colors make the trends page easy to scan, but two labels have low contrast when dark mode is enabled.",
    },
    {
      customerLabel: "Verified reviewer 7315",
      ageHours: 191,
      content:
        "The CSV import summary is excellent because it tells me exactly how many rows succeeded instead of failing the entire file.",
    },
    {
      customerLabel: "Verified reviewer 8041",
      ageHours: 239,
      content:
        "The product is valuable, but the first-run experience needs an example dataset so new users understand what a useful workspace looks like.",
    },
    {
      customerLabel: "Verified reviewer 8927",
      ageHours: 301,
      content:
        "I can finally share read-only access with leadership without worrying that someone will accidentally change a feedback status.",
    },
    {
      customerLabel: "Verified reviewer 9180",
      ageHours: 382,
      content:
        "The report page occasionally jumps back to the top when I expand a cited feedback item near the bottom of the screen.",
    },
    {
      customerLabel: "Verified reviewer 9633",
      ageHours: 491,
      content:
        "The interface looks professional and the loading states make it clear when the dashboard is recalculating filtered results.",
    },
    {
      customerLabel: "Verified reviewer 9972",
      ageHours: 674,
      content:
        "I would recommend the product, although the notification copy around expired invitations should explain what an administrator needs to do next.",
    },
  ],
  "nps-survey": [
    {
      customerLabel: "NPS-2026-Q3-001",
      ageHours: 12,
      content:
        "I would recommend LOOP because it gives our product team one place to compare support complaints with survey responses instead of arguing from anecdotes.",
    },
    {
      customerLabel: "NPS-2026-Q3-014",
      ageHours: 36,
      content:
        "The core workflow is useful, but setting up themes still requires too much manual cleanup when several teams use different words for the same issue.",
    },
    {
      customerLabel: "NPS-2026-Q3-027",
      ageHours: 68,
      content:
        "The weekly report saves time, although leadership wants every recommendation to link directly to the feedback evidence behind it.",
    },
    {
      customerLabel: "NPS-2026-Q3-039",
      ageHours: 91,
      content:
        "Workspace permissions are clear and we were able to give executives read-only access without exposing member-management controls.",
    },
    {
      customerLabel: "NPS-2026-Q3-052",
      ageHours: 126,
      content:
        "The inbox needs saved filters because our support lead repeats the same negative-onboarding search every morning.",
    },
    {
      customerLabel: "NPS-2026-Q3-066",
      ageHours: 172,
      content:
        "Ask LOOP is the feature we are most interested in, but we will only trust it if every answer clearly shows which customer comments were used.",
    },
    {
      customerLabel: "NPS-2026-Q3-078",
      ageHours: 218,
      content:
        "Importing historical feedback was easier than expected and the row-level validation prevented several bad timestamps from entering our workspace.",
    },
    {
      customerLabel: "NPS-2026-Q3-083",
      ageHours: 279,
      content:
        "The dashboard is helpful for weekly reviews, but the date range should stay selected when I move between charts and the feedback inbox.",
    },
    {
      customerLabel: "NPS-2026-Q3-097",
      ageHours: 347,
      content:
        "Performance is acceptable for our current volume, though loading thousands of records during a quarterly review still feels slow.",
    },
    {
      customerLabel: "NPS-2026-Q3-108",
      ageHours: 421,
      content:
        "The product has made customer conversations more visible across departments, and our roadmap meetings now begin with evidence instead of opinions.",
    },
    {
      customerLabel: "NPS-2026-Q3-119",
      ageHours: 538,
      content:
        "We need stronger export controls before uploading regulated customer comments, including a clear record of who generated each report.",
    },
    {
      customerLabel: "NPS-2026-Q3-124",
      ageHours: 701,
      content:
        "The interface is polished, but onboarding should explain the difference between a theme, a feature area, and a feedback status with real examples.",
    },
  ],
  "sales-notes": [
    {
      customerLabel: "Redwood Manufacturing",
      ageHours: 7,
      content:
        "The prospect will move forward with a pilot if SAML SSO and automated user provisioning are available for their security team.",
    },
    {
      customerLabel: "Apex Insurance",
      ageHours: 24,
      content:
        "The buyer needs regional workspace isolation so teams in different countries cannot view each other's customer feedback or reports.",
    },
    {
      customerLabel: "Bluebird Travel",
      ageHours: 49,
      content:
        "The product leader liked the evidence-backed reports but asked whether recurring reports can be generated automatically every Monday morning.",
    },
    {
      customerLabel: "Monarch Foods",
      ageHours: 77,
      content:
        "The evaluation team wants a Salesforce-style source reference on every imported note so they can trace an insight back to the original account record.",
    },
    {
      customerLabel: "Evergreen Energy",
      ageHours: 111,
      content:
        "The customer requires an audit trail for role changes, feedback-status updates, and report generation before procurement can approve deployment.",
    },
    {
      customerLabel: "Silverline Media",
      ageHours: 149,
      content:
        "The head of product asked for theme spike alerts because their team currently discovers emerging complaints only during the monthly review.",
    },
    {
      customerLabel: "Keystone Legal",
      ageHours: 198,
      content:
        "The prospect is interested in Ask LOOP but needs confidence that the answer cannot include data from another workspace or from the model's general memory.",
    },
    {
      customerLabel: "Oakwell Telecom",
      ageHours: 254,
      content:
        "The support director wants bulk status updates because triaging one feedback item at a time will not scale to their weekly volume.",
    },
    {
      customerLabel: "Riverstone Banking",
      ageHours: 329,
      content:
        "The information-security team asked for documented data-retention controls and a way to delete an entire workspace with all tenant-owned records.",
    },
    {
      customerLabel: "Cobalt Robotics",
      ageHours: 407,
      content:
        "The demo landed well because the dashboard connected theme counts to individual customer quotes instead of showing unexplained AI summaries.",
    },
    {
      customerLabel: "Maple Health Group",
      ageHours: 476,
      content:
        "The buyer wants CSV and PDF export options so product insights can be shared with teams that do not have LOOP accounts.",
    },
    {
      customerLabel: "Stonebridge Software",
      ageHours: 503,
      content:
        "The champion believes the product can replace several spreadsheets, but only if search supports exact phrases, customer labels, channels, and date ranges together.",
    },
  ],
};