import { z } from 'zod';

export const LeaderboardEntrySchema = z.object({
    username: z.string().min(1),
    logAmount: z.number().nullable().optional()
});

export type LeaderboardItem = z.infer<typeof LeaderboardEntrySchema>;