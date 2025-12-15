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
import { PostsApi } from '@/lib/api/posts';
import { CommentsApi } from '@/lib/api/comments';
import ReportObjectDialog from '@/components/moderation/ReportObjectDialog';
import GlassCard from '@/components/ui/glass-card';
import { RefreshCw } from 'lucide-react';

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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [isObjectDialogOpen, setIsObjectDialogOpen] = useState(false);
  const handleViewReport = (report: ReportItem) => {
    setActiveReport(report);
    setIsObjectDialogOpen(true);
  };


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
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      setReports(sortedData);
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

  const handleDeleteContent = useCallback(
    async (report: ReportItem) => {
      if (!username) {
        setError(t('moderator.noUsername', 'Missing moderator username'));
        return;
      }
      setDeletingId(report.id);
      try {
        const contentType = report.contentType?.toUpperCase();
        if (contentType === 'POST') {
          await PostsApi.remove(report.objectId);
        } else if (contentType === 'COMMENT') {
          await CommentsApi.remove(report.objectId);
        } else {
          throw new Error(t('moderator.unsupportedContent', 'Unsupported content type'));
        }
        await ReportsApi.markDeletion(username, report.id);
        setReports((prev) => prev.filter((item) => item.id !== report.id));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('moderator.deleteError', 'Failed to delete reported content');
        setError(message);
      } finally {
        setDeletingId((current) => (current === report.id ? null : current));
      }
    },
    [username, t],
  );

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-8 px-4">
        <div className="max-w-6xl mx-auto flex justify-center">
          <GlassCard className="w-full">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Spinner className="h-8 w-8 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('moderator.loading', 'Loading reports...')}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-8 px-4">
      <div className="max-w-6xl mx-auto flex justify-center">
        <GlassCard className="w-full">
          {/* Header */}
          <div className="mb-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-emerald-900">
                  {t('moderator.title', 'Moderator queue')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('moderator.subtitle', 'Review and respond to unresolved reports')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadReports}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {t('moderator.refresh', 'Refresh')}
              </Button>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                {t('moderator.filter.all', 'All')}
              </Button>
              <Button
                variant={filterType === 'feedback' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('feedback')}
              >
                {t('moderator.filter.feedback', 'Feedback')}
              </Button>
              <Button
                variant={filterType === 'POST' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('POST')}
              >
                {t('moderator.filter.post', 'Post')}
              </Button>
              <Button
                variant={filterType === 'COMMENT' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('COMMENT')}
              >
                {t('moderator.filter.comment', 'Comment')}
              </Button>
              <Button
                variant={filterType === 'SPAM' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('SPAM')}
              >
                {t('moderator.filter.spam', 'Spam')}
              </Button>
              <Button
                variant={filterType === 'VIOLENCE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('VIOLENCE')}
              >
                {t('moderator.filter.violence', 'Violence')}
              </Button>
              <Button
                variant={filterType === 'OTHER' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('OTHER')}
              >
                {t('moderator.filter.other', 'Other')}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Reports List */}
          {(() => {
            const filteredReports = reports.filter(report => {
              const isFeedback = report.objectId === -1;
              if (filterType === 'all') return true;
              if (filterType === 'feedback') return isFeedback;
              if (isFeedback) return false;
              if (filterType === 'POST' || filterType === 'COMMENT') return report.contentType === filterType;
              return report.type?.toUpperCase() === filterType;
            });

            return filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto border border-white/20">
                <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                  {t('moderator.empty', 'No unresolved reports — all clear!')}
                </h3>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {filteredReports.map((report) => {
                const isFeedback = report.objectId === -1;
                const displayType = isFeedback ? 'FEEDBACK' : report.contentType;
                const displayTitle = isFeedback && report.type === 'OTHER' ? 'Feedback' : report.type;
                
                return (
                <Card key={report.id} data-testid={`report-${report.id}`}>
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg text-emerald-900">
                        {displayTitle}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {isFeedback 
                          ? t('moderator.sentBy', 'Sent by {{username}}', { username: report.reporterUsername })
                          : t('moderator.reportedBy', 'Reported by {{username}}', { username: report.reporterUsername })
                        }
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={isFeedback ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
                      >
                        {displayType}
                      </Badge>
                      {!isFeedback && (
                        <Badge>{t('moderator.objectId', 'ID {{id}}', { id: report.objectId })}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-3 pt-0">
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                      <p className="text-sm text-foreground">{report.description}</p>
                    </div>
                    <p className="pl-2 text-xs text-muted-foreground">
                      {isFeedback
                        ? t('moderator.sentAt', 'Sent {{time}}', { time: formatTimestamp(report.createdAt) })
                        : t('moderator.reportedAt', 'Reported {{time}}', { time: formatTimestamp(report.createdAt) })
                      }
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {!isFeedback && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                        >
                          {t('moderator.view', 'View content')}
                        </Button>
                      )}
                      {!isFeedback && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeleteContent(report)}
                          disabled={deletingId === report.id}
                        >
                          {deletingId === report.id
                            ? t('moderator.deleting', 'Deleting...')
                            : t('moderator.delete', 'Delete content')}
                        </Button>
                      )}
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
                );
              })}
            </div>
          );
          })()}

          <ReportObjectDialog
            report={activeReport}
            open={isObjectDialogOpen}
            onOpenChange={(open) => {
              setIsObjectDialogOpen(open);
              if (!open) {
                setActiveReport(null);
              }
            }}
          />
        </GlassCard>
      </div>
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


