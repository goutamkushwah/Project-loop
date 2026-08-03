import { z } from "zod";

export const dashboardAnalyticsQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
});

export type DashboardAnalyticsQuery = z.infer<typeof dashboardAnalyticsQuerySchema>;