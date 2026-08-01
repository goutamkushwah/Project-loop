import { z } from "zod";

import { SIMULATED_CHANNEL_KEYS } from "@/lib/simulated-channel-catalog";

export const simulatedChannelImportSchema = z.object({
  source: z.enum(SIMULATED_CHANNEL_KEYS, {
    required_error: "Select a simulated channel source.",
    invalid_type_error: "Select a valid simulated channel source.",
  }),
});

export type SimulatedChannelImportInput = z.infer<
  typeof simulatedChannelImportSchema
>;