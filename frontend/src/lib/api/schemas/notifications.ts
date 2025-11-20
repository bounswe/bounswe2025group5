import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.number().int(),
  type: z.string(),
  actorId: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.string(), // ISO timestamp string
  objectId: z.string().nullable(),
  objectType: z.string().nullable(),
}).passthrough();

export type Notification = z.infer<typeof NotificationSchema>;

export const MarkAsReadResponseSchema = z.object({
  success: z.boolean(),
}).passthrough();

export type MarkAsReadResponse = z.infer<typeof MarkAsReadResponseSchema>;
