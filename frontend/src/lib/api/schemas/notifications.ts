import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.number().int(),
  type: z.string(),
  actorId: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.string(), // ISO timestamp string
  objectId: z.string().nullable(),
  objectType: z.string().nullable(),
  preview: z.string().nullable().optional(), // Preview content from backend (post content, comment content, etc.)
  postMessage: z.string().optional(), // Optional post message preview (populated client-side) - DEPRECATED, use preview
  challengeTitle: z.string().optional(), // Optional challenge title (populated client-side)
  commentContent: z.string().optional(), // Optional comment content (populated client-side) - DEPRECATED, use preview
}).passthrough();

export type Notification = z.infer<typeof NotificationSchema>;

export const MarkAsReadResponseSchema = z.object({
  success: z.boolean(),
}).passthrough();

export type MarkAsReadResponse = z.infer<typeof MarkAsReadResponseSchema>;
