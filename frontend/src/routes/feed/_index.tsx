import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from 'react-i18next';
import PostCard from '@/components/feedpage/post-card';
import CreatePostCard from '@/components/feedpage/create-post-card';
import { PostsApi } from '@/lib/api/posts';
import type { PostItem } from '@/lib/api/schemas/posts';
import { RefreshCw, TrendingUp } from 'lucide-react';
import GlassCard from '@/components/ui/glass-card';

const POSTS_PER_PAGE = 10;

export default function FeedPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [lastPostId, setLastPostId] = useState<number | undefined>();
  const [feedType, setFeedType] = useState<'latest' | 'popular'>('latest');
  const [error, setError] = useState<string | null>(null);
  
  // Get current username from localStorage
  const currentUsername = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

  // Load initial posts
  useEffect(() => {
    loadInitialPosts();
  }, [feedType]);

  const loadInitialPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { size: POSTS_PER_PAGE, ...(currentUsername && { username: currentUsername }) };
      const newPosts = feedType === 'latest' 
        ? await PostsApi.list(params)
        : await PostsApi.listMostLiked(params);

      setPosts(newPosts);
      setLastPostId(newPosts.length > 0 ? newPosts[newPosts.length - 1].postId : undefined);
      setHasMorePosts(newPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError(t('feed.error.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!hasMorePosts || isLoadingMore || !lastPostId) return;

    setIsLoadingMore(true);
    try {
      const params = { size: POSTS_PER_PAGE, ...(currentUsername && { username: currentUsername }) };
      const newPosts = feedType === 'latest'
        ? await PostsApi.list({ ...params, lastPostId })
        : await PostsApi.listMostLiked(params);

      if (newPosts.length > 0) {
        setPosts(prev => [...prev, ...newPosts]);
        setLastPostId(newPosts[newPosts.length - 1].postId);
        setHasMorePosts(newPosts.length === POSTS_PER_PAGE);
      } else {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      setError(t('feed.error.loadMoreFailed'));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    loadInitialPosts();
  };

  const handlePostUpdate = (updatedPost: PostItem) => {
    setPosts(prev =>
      prev.map(post =>
        post.postId === updatedPost.postId ? updatedPost : post
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-8 px-4">
        <div className="max-w-6xl mx-auto flex justify-center">
          <GlassCard className="w-full">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Spinner className="h-8 w-8 mx-auto mb-4" />
                <p className="text-gray-600">{t('feed.loading')}</p>
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-emerald-900">{t('feed.title')}</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t('feed.refresh')}
              </Button>
            </div>

            {/* Feed Type Selector */}
            <div className="flex gap-2">
              <Button
                variant={feedType === 'latest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedType('latest')}
                disabled={isLoading}
              >
                {t('feed.latest')}
              </Button>
              <Button
                variant={feedType === 'popular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedType('popular')}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {t('feed.popular')}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Create Post Card */}
          <div className="mb-6">
            <CreatePostCard 
              onPostCreated={loadInitialPosts}
            />
          </div>

          {/* Posts Feed */}
          {posts.length > 0 ? (
            <div className="space-y-8">
              {/* Posts Masonry Layout */}
              <div className="columns-1 lg:columns-2 gap-6 space-y-6">
                {posts.map((post) => (
                  <div key={post.postId} className="break-inside-avoid mb-6">
                    <PostCard
                      post={post}
                      onPostUpdate={handlePostUpdate}
                    />
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMorePosts && (
                <div className="flex justify-center pt-6">
                  <Button
                    onClick={loadMorePosts}
                    disabled={isLoadingMore}
                    variant="outline"
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {isLoadingMore ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        {t('feed.loadingMore')}
                      </>
                    ) : (
                      t('feed.loadMore')
                    )}
                  </Button>
                </div>
              )}

              {/* End of Feed Message */}
              {!hasMorePosts && posts.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {t('feed.endOfFeed')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto border border-white/20">
                <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                  {t('feed.empty.title')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('feed.empty.description')}
                </p>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('feed.tryAgain')}
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}