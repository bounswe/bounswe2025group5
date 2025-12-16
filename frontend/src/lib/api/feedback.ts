import { ApiClient } from './client';
import { z } from 'zod';

// Feedback API response schema (snake_case from backend)
const FeedbackApiSchema = z.object({
  feedbackId: z.number().int(),
  feedbackerUsername: z.string(),
  contentType: z.string(),
  content: z.string(),
  isSeen: z.boolean().optional(),
  createdAt: z.string(),
});

// Frontend schema (will map feedbackId to id)
export const FeedbackResponseSchema = z.object({
  id: z.number().int(),
  feedbackerUsername: z.string(),
  contentType: z.string(),
  content: z.string(),
  isSeen: z.boolean().optional(),
  createdAt: z.string(),
});

export type FeedbackResponse = z.infer<typeof FeedbackResponseSchema>;

export const FeedbackRequestSchema = z.object({
  feedbackerUsername: z.string(),
  contentType: z.string(),
  content: z.string(),
});

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

export const FeedbackApi = {
  /**
   * Get unseen feedbacks for a moderator
   */
  getUnseen: async (username: string): Promise<FeedbackResponse[]> => {
    const data = await ApiClient.get<z.infer<typeof FeedbackApiSchema>[]>(`/api/feedback/unseen/${username}`);
    return data.map(item => {
      const validated = FeedbackApiSchema.parse(item);
      return {
        id: validated.feedbackId,
        feedbackerUsername: validated.feedbackerUsername,
        contentType: validated.contentType,
        content: validated.content,
        isSeen: validated.isSeen,
        createdAt: validated.createdAt,
      };
    });
  },

  /**
   * Submit feedback
   */
  create: async (request: FeedbackRequest): Promise<void> => {
    await ApiClient.post<void>('/api/feedback', request);
  },

  /**
   * Mark feedback as seen
   */
  markAsSeen: async (feedbackId: number, username: string): Promise<{ success: boolean }> => {
    const data = await ApiClient.put<{ success: boolean }>(`/api/feedback/seen/${feedbackId}/${username}`);
    return data;
  },
};
