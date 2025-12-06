import { ApiClient } from './client';

export type ReportItem = {
  id: number;
  reporterUsername: string;
  type: string;
  description: string;
  isSolved: number;
  contentType: string;
  objectId: number;
  createdAt: string;
};

export type CreateReportPayload = {
  reporterName: string;
  description: string;
  type: string;
  contentType: string;
  objectId: number;
};

export type CreateReportResponse = {
  success: boolean;
};

export type MarkReportResponse = {
  success: boolean;
  id: number;
};

export const ReportsApi = {
  getUnread: (username: string) =>
    ApiClient.get<ReportItem[]>(`/api/reports/${encodeURIComponent(username)}/unread`),
  markSolved: (username: string, reportId: number) =>
    ApiClient.put<MarkReportResponse>(`/api/reports/${encodeURIComponent(username)}/${reportId}/solve-flag`),
  create: (payload: CreateReportPayload) =>
    ApiClient.post<CreateReportResponse>('/api/reports', payload),
};


