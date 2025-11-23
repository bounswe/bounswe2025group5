import { ApiClient } from './client';
import { z } from 'zod';
import { WasteTypeSchema } from './schemas/goals';
export const WasteLogSchema = z.object({
  logId: z.number().int().optional(),
  amount: z.number().optional(),
  createdAt: z.string().optional(),
}).passthrough();

export const GetWasteLogsSchema = z.array(WasteLogSchema);
export type WasteLog = z.infer<typeof WasteLogSchema>;

export const CreateOrEditWasteLogResponseSchema = WasteLogSchema;
export const DeleteWasteLogResponseSchema = z.object({ logId: z.number().int().optional() }).passthrough();

export const TotalLogResponseSchema = z.object({
  wasteType: WasteTypeSchema,
  totalAmount: z.number().nonnegative(),
}).passthrough();
export type TotalLogResponse = z.infer<typeof TotalLogResponseSchema>;

export const MonthlyWasteDataSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  totalWeight: z.number().nonnegative(),
}).passthrough();
export type MonthlyWasteData = z.infer<typeof MonthlyWasteDataSchema>;

export const WasteLogMonthlyResponseSchema = z.object({
  username: z.string(),
  wasteType: z.string(),
  monthlyData: z.array(MonthlyWasteDataSchema),
}).passthrough();
export type WasteLogMonthlyResponse = z.infer<typeof WasteLogMonthlyResponseSchema>;

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
    const res = await ApiClient.get<TotalLogResponse>(`/api/logs/summary?${query.toString()}`);
    return TotalLogResponseSchema.parse(res);
  },
  monthly: async (params: { username: string; wasteType: string }) => {
    const query = new URLSearchParams({
      wasteType: params.wasteType,
    });
    const res = await ApiClient.get<WasteLogMonthlyResponse>(
      `/api/logs/${encodeURIComponent(params.username)}/monthly?${query.toString()}`
    );
    return WasteLogMonthlyResponseSchema.parse(res);
  },
};


