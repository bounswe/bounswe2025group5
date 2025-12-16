import { useCallback, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ModeratorRoute from '@/services/ModeratorRoute';
import { ReportsApi, type ReportItem } from '@/lib/api/reports';
import { FeedbackApi, type FeedbackResponse } from '@/lib/api/feedback';
import { USERNAME_KEY } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { PostsApi } from '@/lib/api/posts';
import { CommentsApi } from '@/lib/api/comments';
import { UsersApi } from '@/lib/api/users';
import ReportObjectDialog from '@/components/moderation/ReportObjectDialog';
import GlassCard from '@/components/ui/glass-card';
import { RefreshCw } from 'lucide-react';

const formatTimestamp = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const getFeedbackBadgeColor = (contentType: string) => {
  switch (contentType) {
    case 'Suggestion':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Compliment':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Complaint':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300';
  }
};

const getReportBadgeColor = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'SPAM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'VIOLENCE':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'POST':
    case 'COMMENT':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

type ModeratorItem = (ReportItem & { itemType: 'report' }) | (FeedbackResponse & { itemType: 'feedback' });

export function ModeratorDashboard() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [solvingId, setSolvingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [isObjectDialogOpen, setIsObjectDialogOpen] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Map<string, string | null>>(new Map());
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
      const [reportsData, feedbacksData] = await Promise.all([
        ReportsApi.getUnread(storedUsername),
        FeedbackApi.getUnseen(storedUsername)
      ]);
      setReports(reportsData);

      // Collect unique usernames
      const uniqueUsernames = new Set<string>();
      reportsData.forEach(r => {
        if (r.reporterUsername) uniqueUsernames.add(r.reporterUsername);
      });
      feedbacksData.forEach(f => {
        if (f.feedbackerUsername) uniqueUsernames.add(f.feedbackerUsername);
      });

      // Fetch profiles for unique usernames only
      const profileMap = new Map<string, string | null>();
      await Promise.all(
        Array.from(uniqueUsernames).map(async (uname) => {
          try {
            const profile = await UsersApi.getUserByUsername(uname);
            profileMap.set(uname, profile.profilePhotoUrl || null);
          } catch {
            profileMap.set(uname, null);
          }
        })
      );
      setUserProfiles(profileMap);
      setFeedbacks(feedbacksData);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('moderator.error', 'Failed to load reports');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleSolve = useCallback(
    async (item: ModeratorItem) => {
      if (!username) {
        setError(t('moderator.noUsername', 'Missing moderator username'));
        return;
      }
      const itemId = item.itemType === 'report' ? item.id : item.id;
      setSolvingId(itemId);
      try {
        if (item.itemType === 'report') {
          await ReportsApi.markSolved(username, item.id);
          setReports((prev) => prev.filter((report) => report.id !== item.id));
        } else {
          await FeedbackApi.markAsSeen(item.id, username);
          setFeedbacks((prev) => prev.filter((feedback) => feedback.id !== item.id));
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('moderator.solveError', 'Failed to mark as resolved');
        setError(message);
      } finally {
        setSolvingId((current) => (current === itemId ? null : current));
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
            const allItems: ModeratorItem[] = [
              ...reports.map(r => ({ ...r, itemType: 'report' as const })),
              ...feedbacks.map(f => ({ ...f, itemType: 'feedback' as const }))
            ].sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA;
            });

            const filteredItems = allItems.filter(item => {
              if (filterType === 'all') return true;
              if (filterType === 'feedback') return item.itemType === 'feedback';
              if (item.itemType === 'feedback') return false;
              if (filterType === 'POST' || filterType === 'COMMENT') return item.contentType === filterType;
              return item.type?.toUpperCase() === filterType;
            });

            return filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto border border-white/20">
                <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                  {t('moderator.empty', 'No unresolved reports — all clear!')}
                </h3>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {filteredItems.map((item) => {
                const isFeedback = item.itemType === 'feedback';
                const displayType = isFeedback ? item.contentType : item.contentType;
                const displayTitle = isFeedback ? item.contentType : item.type;
                const content = isFeedback ? item.content : item.description;
                const username = isFeedback ? item.feedbackerUsername : item.reporterUsername;
                const itemId = item.id;
                
                // Card styling based on type
                const cardClassName = isFeedback 
                  ? 'ring-2 ring-tertiary'
                  : 'ring-2 ring-accent';
                
                // Badge color based on subtype
                const badgeColor = isFeedback 
                  ? getFeedbackBadgeColor(item.contentType)
                  : getReportBadgeColor(displayType);
                
                return (
                <Card key={`${item.itemType}-${item.id}`} data-testid={`${item.itemType}-${item.id}`} className={cardClassName}>
                  <div className="flex justify-center pt-0 pb-0">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isFeedback ? 'bg-tertiary text-white' : 'bg-accent text-white'
                    }`}>
                      {isFeedback ? 'FEEDBACK' : 'REPORT'}
                    </div>
                  </div>
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-0">
                    <div>
                      <CardTitle className="text-lg text-emerald-900">
                        {displayTitle}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {isFeedback 
                          ? t('moderator.sentBy', 'Sent by {{username}}', { username })
                          : t('moderator.reportedBy', 'Reported by {{username}}', { username })
                        }
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={badgeColor}
                      >
                        {displayType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-3 pt-0">
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                      <p className="text-sm text-foreground">{content}</p>
                    </div>
                    <p className="pl-2 text-xs text-muted-foreground">
                      {isFeedback
                        ? t('moderator.sentAt', 'Sent {{time}}', { time: formatTimestamp(item.createdAt) })
                        : t('moderator.reportedAt', 'Reported {{time}}', { time: formatTimestamp(item.createdAt) })
                      }
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {!isFeedback && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(item as ReportItem)}
                        >
                          {t('moderator.view', 'View content')}
                        </Button>
                      )}
                      {!isFeedback && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeleteContent(item as ReportItem)}
                          disabled={deletingId === itemId}
                        >
                          {deletingId === itemId
                            ? t('moderator.deleting', 'Deleting...')
                            : t('moderator.delete', 'Delete content')}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void handleSolve(item)}
                        disabled={solvingId === itemId}
                      >
                        {solvingId === itemId
                          ? t('moderator.solving', 'Marking...')
                          : isFeedback
                            ? t('moderator.markSeen', 'Mark as seen')
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


