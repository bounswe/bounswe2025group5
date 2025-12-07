import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ReportItem } from '@/lib/api/reports';
import type { PostItem } from '@/lib/api/schemas/posts';
import type { Comment } from '@/lib/api/comments';
import { PostsApi } from '@/lib/api/posts';
import { CommentsApi } from '@/lib/api/comments';
import PostCard from '@/components/feedpage/post-card';
import { Spinner } from '@/components/ui/spinner';

interface ReportObjectDialogProps {
  report: ReportItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReportObjectDialog({ report, open, onOpenChange }: ReportObjectDialogProps) {
  const { t } = useTranslation();
  const [post, setPost] = useState<PostItem | null>(null);
  const [comment, setComment] = useState<Comment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!report || !open) {
      setPost(null);
      setComment(null);
      setError(null);
      return;
    }

    const fetchObject = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const type = report.contentType?.toUpperCase();
        if (type === 'POST') {
          const username = localStorage.getItem('username');
          const fetchedPost = await PostsApi.getById(report.objectId, username || undefined);
          setPost(fetchedPost);
          setComment(null);
        } else if (type === 'COMMENT') {
          const fetchedComment = await CommentsApi.getById(report.objectId);
          setComment(fetchedComment);
          if (fetchedComment.postId != null) {
            const fetchedPost = await PostsApi.getById(fetchedComment.postId);
            setPost(fetchedPost);
          } else {
            setPost(null);
          }
        } else {
          setError(t('moderator.unsupportedContent', 'Unsupported content type'));
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('moderator.viewError', 'Unable to load reported content');
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchObject();
  }, [report, open, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('moderator.dialogTitle', {
              defaultValue: 'Reported {{type}}',
              type: report?.contentType?.toLowerCase(),
            })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Spinner className="mr-2 h-4 w-4" />
              {t('moderator.viewing', 'Loading content...')}
            </div>
          )}
          {error && !isLoading && (
            <p className="text-center text-destructive py-6">
              {error}
            </p>
          )}
          {!isLoading && !error && (
            <>
              {comment && (
                <div className="rounded-lg border border-muted p-4 bg-muted/40">
                  <p className="text-sm font-semibold text-foreground">
                    {t('moderator.commentPreview', {
                      defaultValue: 'Comment by {{username}}',
                      username: comment.creatorUsername ?? comment.username ?? 'unknown',
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {comment.content}
                  </p>
                </div>
              )}
              {post ? (
                <PostCard
                  post={post}
                  onPostUpdate={(updatedPost) => setPost(updatedPost)}
                  onPostDelete={() => setPost(null)}
                  onUsernameClick={() => undefined}
                />
              ) : (
                !comment && (
                  <p className="text-center text-muted-foreground py-8">
                    {t('moderator.viewError', 'Unable to load reported content')}
                  </p>
                )
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


