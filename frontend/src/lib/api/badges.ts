import { ApiClient } from './client';
import { z } from 'zod';
import { BadgeSchema, type Badge } from './schemas/badge';

export const BadgeApi = {
  getBadges: async (username: string): Promise<Badge[]> => {
    const res = await ApiClient.get<Badge[]>(`/api/users/${encodeURIComponent(username)}/badges`);
    return z.array(BadgeSchema).parse(res);
  }
};