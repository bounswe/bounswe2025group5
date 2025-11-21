import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.number().int(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.string(), // ISO timestamp string
  objectId: z.string().nullable().optional(),
  objectType: z.string().nullable().optional(),
}).passthrough();

export type Notification = z.infer<typeof NotificationSchema>;

export const MarkAsReadResponseSchema = z.object({
  success: z.boolean(),
}).passthrough();

export type MarkAsReadResponse = z.infer<typeof MarkAsReadResponseSchema>;
