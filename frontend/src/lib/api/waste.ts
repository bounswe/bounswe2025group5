import { ApiClient } from './client';
import { z } from 'zod';

export const WasteLogSchema = z.object({
  logId: z.number().int().optional(),
  amount: z.number().optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const GetWasteLogsSchema = z.array(WasteLogSchema);
export type WasteLog = z.infer<typeof WasteLogSchema>;

export const CreateOrEditWasteLogResponseSchema = WasteLogSchema;
export const DeleteWasteLogResponseSchema = z.object({ logId: z.number().int().optional() }).passthrough();

export const TotalLogResponseSchema = z.object({ total: z.number().optional() }).passthrough();

export const WasteApi = {
  list: async (goalId: number) => {
    const res = await ApiClient.get<WasteLog[]>(`/api/waste-goals/${goalId}/logs`);
    GetWasteLogsSchema.parse(res);
    return res;
  },
  create: async (goalId: number, payload: Record<string, unknown>) => {
    const res = await ApiClient.post<WasteLog>(`/api/waste-goals/${goalId}/logs`, payload);
    return CreateOrEditWasteLogResponseSchema.parse(res);
  },
  update: async (logId: number, payload: Record<string, unknown>) => {
    const res = await ApiClient.put<WasteLog>(`/api/logs/${logId}`, payload);
    return CreateOrEditWasteLogResponseSchema.parse(res);
  },
  remove: async (logId: number) => {
    const res = await ApiClient.delete<{ logId?: number }>(`/api/logs/${logId}`);
    return DeleteWasteLogResponseSchema.parse(res);
  },
  summary: async (params: { startDate: string; endDate: string; wasteType: string }) => {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      wasteType: params.wasteType,
    });
    const res = await ApiClient.get<{ total?: number }>(`/api/logs/summary?${query.toString()}`);
    return TotalLogResponseSchema.parse(res);
  },
};


