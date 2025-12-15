import { z } from 'zod';

export const BadgeSchema = z.object({
    username: z.string().min(1),
    badgeName: z.string().min(1),
})

export type Badge = z.infer<typeof BadgeSchema>;