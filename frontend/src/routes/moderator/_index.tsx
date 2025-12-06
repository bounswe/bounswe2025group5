import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModeratorRoute from '@/services/ModeratorRoute';
import { ReportsApi, type ReportItem } from '@/lib/api/reports';
import { USERNAME_KEY } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

const formatTimestamp = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

export function ModeratorDashboard() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [solvingId, setSolvingId] = useState<number | null>(null);

  const loadReports = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const storedUsername = localStorage.getItem(USERNAME_KEY);
      if (!storedUsername) {
        throw new Error(t('moderator.noUsername', 'Missing moderator username'));
      }
      setUsername(storedUsername);
      const data = await ReportsApi.getUnread(storedUsername);
      setReports(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('moderator.error', 'Failed to load reports');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleSolve = useCallback(
    async (reportId: number) => {
      if (!username) {
        setError(t('moderator.noUsername', 'Missing moderator username'));
        return;
      }
      setSolvingId(reportId);
      try {
        await ReportsApi.markSolved(username, reportId);
        setReports((prev) => prev.filter((report) => report.id !== reportId));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('moderator.solveError', 'Failed to mark report as solved');
        setError(message);
      } finally {
        setSolvingId((current) => (current === reportId ? null : current));
      }
    },
    [username, t],
  );

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('moderator.title', 'Moderator queue')}
          </h1>
          <p className="text-muted-foreground">
            {t('moderator.subtitle', 'Review and respond to unresolved reports')}
          </p>
        </div>
        <Button onClick={loadReports} disabled={loading}>
          {loading ? t('moderator.refreshing', 'Refreshing...') : t('moderator.refresh', 'Refresh')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" data-testid="error-banner">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/30 p-8 text-center text-muted-foreground">
          {t('moderator.empty', 'No unresolved reports — all clear!')}
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} data-testid={`report-${report.id}`}>
              <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {report.type}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t('moderator.reportedBy', 'Reported by {{username}}', { username: report.reporterUsername })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{report.contentType}</Badge>
                  <Badge>{t('moderator.objectId', 'ID {{id}}', { id: report.objectId })}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">{report.description}</p>
                <p className="text-xs text-muted-foreground">
                  {t('moderator.reportedAt', 'Reported {{time}}', { time: formatTimestamp(report.createdAt) })}
                </p>
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleSolve(report.id)}
                    disabled={solvingId === report.id}
                  >
                    {solvingId === report.id
                      ? t('moderator.solving', 'Marking...')
                      : t('moderator.solve', 'Mark as solved')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ModeratorIndex() {
  return (
    <ModeratorRoute>
      <ModeratorDashboard />
    </ModeratorRoute>
  );
}


