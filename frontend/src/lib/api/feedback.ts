import { ApiClient } from './client';
import { z } from 'zod';

// Feedback schemas
export const FeedbackResponseSchema = z.object({
  id: z.number().int(),
  feedbackerUsername: z.string(),
  contentType: z.string(),
  content: z.string(),
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
    const data = await ApiClient.get<FeedbackResponse[]>(`/api/feedback/unseen/${username}`);
    data.forEach(item => FeedbackResponseSchema.parse(item));
    return data;
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
